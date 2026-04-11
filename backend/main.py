import asyncio
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel

import db
import audio_service


# ---------- lifespan ----------

@asynccontextmanager
async def lifespan(app: FastAPI):
    db.ensure_tables()
    yield


app = FastAPI(title="PeckerHeckler API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- request / response models ----------

class IncidentCreate(BaseModel):
    device_id: str
    detected_at: Optional[datetime] = None
    confidence: Optional[float] = None


class RespondRequest(BaseModel):
    action: str  # "hawk" | "eagle" | "polar_bear" | "stream"


class ControlRequest(BaseModel):
    action: str  # "start" | "stop"


# ---------- WebSocket stream relay ----------
# Keyed by incident_id → {"sender": ws | None, "receiver": ws | None}
_stream_sessions: dict[int, dict] = {}


# ---------- health ----------

@app.get("/health")
def health():
    return {"ok": True}


@app.get("/health/db")
def health_db():
    try:
        db.ensure_tables()
        return {"ok": True}
    except Exception as e:
        return {"ok": False, "error": str(e)}


# ---------- devices ----------

@app.get("/devices/{device_id}")
def get_device(device_id: str):
    device = db.get_device(device_id)
    if not device:
        raise HTTPException(404, "Device not found")
    return device


@app.post("/devices/{device_id}/control", status_code=204)
def control_device(device_id: str, body: ControlRequest):
    device = db.get_device(device_id)
    if not device:
        raise HTTPException(404, "Device not found")
    if body.action not in ("start", "stop"):
        raise HTTPException(400, "action must be 'start' or 'stop'")
    db.set_device_monitoring(device_id, body.action == "start")


# ---------- incidents ----------

@app.post("/incidents", status_code=201)
def create_incident(body: IncidentCreate):
    return db.create_incident(body.device_id, body.detected_at, body.confidence)


@app.get("/incidents")
def list_incidents(device_id: Optional[str] = Query(None)):
    return db.get_incidents(device_id)


@app.get("/incidents/{incident_id}")
def get_incident(incident_id: int):
    incident = db.get_incident(incident_id)
    if not incident:
        raise HTTPException(404, "Incident not found")
    return incident


@app.get("/incidents/{incident_id}/response")
def get_response(incident_id: int):
    incident = db.get_incident(incident_id)
    if not incident:
        raise HTTPException(404, "Incident not found")
    action = incident.get("response_action")
    if action is None:
        # No response yet — firmware polls this; return 204
        return Response(status_code=204)
    return {"action": action}


@app.post("/incidents/{incident_id}/respond", status_code=204)
def respond(incident_id: int, body: RespondRequest):
    incident = db.get_incident(incident_id)
    if not incident:
        raise HTTPException(404, "Incident not found")
    valid = {"hawk", "eagle", "polar_bear", "stream"}
    if body.action not in valid:
        raise HTTPException(400, f"action must be one of {valid}")

    # Polar bear is limited to once per day per device (per legal disclaimer)
    if body.action == "polar_bear":
        count = db.count_polar_bear_today(incident["device_id"])
        if count >= 1:
            raise HTTPException(
                429,
                "Polar Bear may only be used once per day per device. "
                "Please choose a different deterrent."
            )

    db.set_incident_response(incident_id, body.action)


# ---------- audio ----------

@app.get("/audio/{sound_name}")
def get_audio(sound_name: str):
    try:
        pcm = audio_service.get_sound_pcm(sound_name)
    except ValueError as e:
        raise HTTPException(400, str(e))
    except FileNotFoundError as e:
        raise HTTPException(404, str(e))
    # Raw signed 16-bit little-endian PCM at 16 kHz mono
    return Response(
        content=pcm,
        media_type="application/octet-stream",
        headers={
            "X-Audio-SampleRate": "16000",
            "X-Audio-Channels": "1",
            "X-Audio-BitsPerSample": "16",
        },
    )


# ---------- audio streaming (WebSocket relay) ----------
# Mobile app connects as sender: WS /stream/{incident_id}?role=sender
# ESP32 connects as receiver:    WS /stream/{incident_id}?role=receiver
# Backend relays raw PCM bytes from sender → receiver in real time.

@app.websocket("/stream/{incident_id}")
async def stream(websocket: WebSocket, incident_id: int, role: str = Query(...)):
    if role not in ("sender", "receiver"):
        await websocket.close(code=4000)
        return

    incident = db.get_incident(incident_id)
    if not incident:
        await websocket.close(code=4004)
        return

    await websocket.accept()

    if incident_id not in _stream_sessions:
        _stream_sessions[incident_id] = {"sender": None, "receiver": None}

    session = _stream_sessions[incident_id]
    session[role] = websocket

    try:
        if role == "sender":
            # Relay incoming PCM chunks to the receiver
            async for chunk in websocket.iter_bytes():
                receiver = session.get("receiver")
                if receiver:
                    try:
                        await receiver.send_bytes(chunk)
                    except Exception:
                        pass  # receiver disconnected; keep accepting from sender
        else:
            # Receiver (ESP32): keep connection alive, data arrives via relay
            await asyncio.Event().wait()

    except WebSocketDisconnect:
        pass
    finally:
        session[role] = None
        # Clean up session if both sides disconnected
        if not session["sender"] and not session["receiver"]:
            _stream_sessions.pop(incident_id, None)
