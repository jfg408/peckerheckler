# PeckerHeckler Architecture

## Overview

PeckerHeckler is a WiFi-connected hardware device that continuously listens for woodpecker sounds, alerts a mobile app when one is detected, and plays a deterrent sound (hawk, eagle, or bear call) — or streams live audio from the user's phone — through an outdoor speaker.

## Repository Structure

```
peckerheckler/
├── firmware/           # ESP32-S3 C firmware (ESP-IDF v5.5.2)
├── backend/            # FastAPI Python backend
├── web-app/            # Next.js landing page
├── mobile-app/         # Expo React Native app
├── src/                # Shared assets (logo, etc.)
├── docs/               # Generated documentation (PINOUT.md)
├── scripts/            # Utility scripts
└── ARCHITECTURE.md     # This file
```

---

## Hardware

### Bill of Materials

| Component     | Model                    | Notes                              |
|---------------|--------------------------|------------------------------------|
| MCU           | ESP32-S3-DevKitC-1 (N8R8)| Same as Someday Box                |
| Microphone    | INMP441                  | I2S, 24-bit, 61 dB SNR, 60Hz–15kHz|
| Amplifier     | MAX98357A                | 3W Class D, I2S input              |
| Speaker       | 5W 8Ω                    | Outdoor-capable, 2–3"              |
| Status LED    | WS2812 RGB               | Addressable, single indicator      |
| Power         | 5V 2A USB-C              |                                    |

### Pinout

**Single source of truth:** `firmware/main/pinout.h`
**Auto-generated docs:** `docs/PINOUT.md` via `python scripts/generate_pinout_docs.py`

All pins match the Someday Box pinout where the same hardware is used.

| Signal      | GPIO | Component              | Notes                     |
|-------------|------|------------------------|---------------------------|
| `MIC_SD`    | 1    | INMP441 Serial Data    | I2S data line             |
| `MIC_WS`    | 13   | INMP441 Word Select    | I2S LR clock              |
| `MIC_SCK`   | 14   | INMP441 Serial Clock   | I2S bit clock             |
| `SPK_DIN`   | 6    | MAX98357A Data In      | I2S data line             |
| `SPK_LRC`   | 4    | MAX98357A LR Clock     | I2S LR clock              |
| `SPK_BCLK`  | 5    | MAX98357A Bit Clock    | I2S bit clock             |
| `LED_DATA`  | 38   | WS2812 Data            | Via RMT peripheral        |

---

## Firmware

### Build System

- **Framework:** ESP-IDF v5.5.2 + CMake
- **Language:** C + FreeRTOS
- **Target:** `esp32s3`

### File Structure

```
firmware/main/
├── pinout.h              # GPIO definitions with @pinout doc tags
├── main.c                # app_main, top-level detection loop
├── detector.h            # Audio pattern detection API
├── detector.c            # Detection engine implementation
├── patterns.h            # Pattern definitions (woodpeckerPattern, etc.)
├── responder.h           # Deterrent playback + audio streaming API
├── responder.c           # Response handling implementation
├── cloud.h               # WiFi / HTTP / WebSocket communication API
├── cloud.c               # Cloud integration implementation
├── mic.h / mic.c         # INMP441 I2S driver (16kHz, 24-bit)
├── speaker.h / speaker.c # MAX98357A I2S driver (16kHz mono)
├── led.h / led.c         # WS2812 status LED via RMT
└── CMakeLists.txt
```

### Entry Point

```c
void app_main(void) {
    nvs_flash_init();
    wifi_connect();
    mic_init();
    speaker_init();
    led_init();
    cloud_device_register();

    led_set_color(LED_GREEN);

    for (;;) {
        detect(&woodpeckerPattern);
    }
}
```

### Detection Engine (`detector.h / patterns.h`)

```c
typedef struct {
    float burst_rate_hz_min;    // Min drumming taps per second
    float burst_rate_hz_max;    // Max drumming taps per second
    int   burst_min_taps;       // Minimum taps to confirm a detection
    float amplitude_threshold;  // Normalized amplitude for tap detection (0.0–1.0)
    int   cooldown_ms;          // Lockout period after a confirmed detection
} pattern_t;

// Default pattern — declared in patterns.h, defined in patterns.c
extern const pattern_t woodpeckerPattern;

// Blocks until a match is detected, then returns
void detect(const pattern_t *pattern);
```

**Woodpecker pattern values:**

| Parameter             | Value    | Basis                              |
|-----------------------|----------|------------------------------------|
| `burst_rate_hz_min`   | 10.0     | Typical woodpecker: 10–25 taps/sec |
| `burst_rate_hz_max`   | 25.0     |                                    |
| `burst_min_taps`      | 8        | Avoid false positives              |
| `amplitude_threshold` | 0.15     | Tunable via Kconfig                |
| `cooldown_ms`         | 10000    | 10 seconds between alerts          |

**Detection algorithm (inside `detect()`):**

1. Sample mic at 16 kHz in 50 ms windows
2. Calculate RMS amplitude per window
3. Detect transient peaks above `amplitude_threshold`
4. Measure inter-peak intervals → derive burst rate (Hz)
5. If burst rate is within range AND tap count ≥ `burst_min_taps` → detection confirmed, return

### Detection → Response Flow

```
detect() returns
    │
    ├─ led_set_color(LED_ORANGE)       // "waiting for response"
    │
    ├─ POST /incidents
    │     body: { device_id, detected_at, confidence }
    │     resp: { id: 42 }
    │
    ├─ Poll GET /incidents/42/response  (every 2s, 30s timeout)
    │     resp: { action: "hawk" | "eagle" | "bear" | "stream" }
    │
    ├─ if action == "hawk" | "eagle" | "bear":
    │     GET /audio/{action}  →  raw 16kHz PCM bytes
    │     speaker_play_buffer_16k_mono(pcm, sample_count)
    │
    └─ if action == "stream":
          ws_connect("/stream/42")
          receive PCM chunks from phone mic → speaker in real time
          ws_close() when stream ends

    └─ led_set_color(LED_GREEN)        // resume monitoring
       detect(&woodpeckerPattern)
```

### Status LED

| Color           | State                              |
|-----------------|------------------------------------|
| Blue (pulse)    | Connecting to WiFi                 |
| Green           | Monitoring / listening             |
| Orange          | Detection confirmed, awaiting response |
| Purple          | Playing deterrent / streaming audio|
| Red (flash)     | Error                              |
| Off             | Monitoring paused (user command)   |

### I2S Audio

Same drivers as Someday Box:

- **Mic:** I2S port 0, 16 kHz, 24-bit (INMP441)
- **Speaker:** I2S port 1, 16 kHz mono PCM (MAX98357A)
- Deterrent sounds fetched as raw PCM from backend on demand
- Live phone audio received as PCM chunks over WebSocket

### Configuration (Kconfig / `idf.py menuconfig`)

- WiFi SSID / Password
- Backend API URL
- Detection amplitude threshold (maps to `amplitude_threshold`)
- Device ID auto-derived from MAC address: `ph-{6 MAC bytes hex}`

### NVS Storage

| Namespace | Key           | Value                     |
|-----------|---------------|---------------------------|
| `ph`      | `device_id`   | `ph-aabbccddeeff`         |
| `ph`      | `wifi_ssid`   | WiFi network name         |
| `ph`      | `wifi_pass`   | WiFi password             |
| `ph`      | `last_detect` | Timestamp of last detection |
| `ph`      | `monitoring`  | `1` or `0` (pause state)  |

---

## Backend

### Tech Stack

- **Framework:** FastAPI (Python 3)
- **Database:** PostgreSQL
- **Audio Storage:** Local filesystem or S3 (deterrent sound files)

### File Structure

```
backend/
├── main.py           # FastAPI app + route definitions
├── db.py             # Database operations (psycopg2)
├── audio_service.py  # Deterrent audio file management
├── .env              # Environment config (gitignored)
├── .env.example      # Template
└── requirements.txt
```

### API Endpoints

#### Devices
```
GET  /devices/{device_id}           → { id, name, is_monitoring, registered_at }
POST /devices/{device_id}/control   → body: { action: "start" | "stop" }
```

#### Incidents
```
POST /incidents                     → body: { device_id, detected_at, confidence }
GET  /incidents                     → [{ id, device_id, detected_at, response_action, ... }]
GET  /incidents/{id}                → incident detail
GET  /incidents/{id}/response       → { action } or 204 (not yet responded)
POST /incidents/{id}/respond        → body: { action: "hawk"|"eagle"|"bear"|"stream" }
```

#### Audio
```
GET  /audio/{sound_name}            → audio/octet-stream (raw 16 kHz mono PCM)
                                      sound_name: "hawk" | "eagle" | "bear"
```

#### Streaming
```
WS   /stream/{incident_id}          → bidirectional PCM chunks (phone mic → speaker)
```

#### Health
```
GET  /health                        → { ok: true }
GET  /health/db                     → { ok: true | false }
```

### Database Schema

```sql
device (
    id            TEXT PRIMARY KEY,        -- "ph-aabbccddeeff" (MAC-derived)
    name          TEXT,
    is_monitoring BOOLEAN DEFAULT TRUE,
    registered_at TIMESTAMPTZ DEFAULT NOW()
)

incident (
    id              SERIAL PRIMARY KEY,
    device_id       TEXT REFERENCES device(id),
    detected_at     TIMESTAMPTZ DEFAULT NOW(),
    confidence      REAL,                  -- 0.0–1.0
    response_action TEXT,                  -- NULL until responded
    responded_at    TIMESTAMPTZ,
    audio_played    TEXT                   -- sound name or "stream"
)
```

### Auto-Registration

On first `POST /incidents`, the backend upserts the device record (same pattern as Someday Box):

```python
cur.execute("""
    INSERT INTO device (id) VALUES (%s)
    ON CONFLICT (id) DO NOTHING
""", (device_id,))
```

### Environment Variables

```
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=peckerheckler
POSTGRES_USER=postgres
POSTGRES_PASSWORD=***
AUDIO_DIR=./audio          # Path to hawk.pcm, eagle.pcm, bear.pcm
```

---

## Web App

### Tech Stack

- **Framework:** Next.js 14 (React 18, TypeScript)
- **Styling:** CSS Modules + Tailwind CSS

### File Structure

```
web-app/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Landing page
│   │   └── layout.tsx
│   ├── components/
│   │   └── AppMockup.tsx         # Mobile incident response screen mockup
│   └── globals.css
├── public/
│   └── logo.png
└── package.json
```

### Landing Page (`page.tsx`)

- Project name + tagline
- How it works: detect → alert → deter
- **Inline mobile app mockup** showing the incident response screen (see design below)
- Setup / download CTA

The mockup is a styled React component (`AppMockup.tsx`) that renders the incident response screen UI as it appears on a phone.

### Environment

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Mobile App

### Tech Stack

- **Framework:** Expo SDK 51 (React Native, TypeScript)
- **Router:** Expo Router (file-based routing)
- **Notifications:** Expo Notifications (FCM / APNs for incident alerts)

### File Structure

```
mobile-app/
├── app/
│   ├── (tabs)/
│   │   ├── _layout.tsx           # Bottom tab navigator (2 tabs)
│   │   ├── index.tsx             # Tab 1: Status
│   │   └── history.tsx           # Tab 2: History
│   ├── incident/
│   │   └── [id].tsx              # Incident response screen (pushed on notification)
│   ├── _layout.tsx               # Root stack navigator
│   └── +not-found.tsx
├── components/
│   ├── DeviceStatusCard.tsx      # Connection + listening state display
│   ├── IncidentCard.tsx          # Single incident row in history
│   └── ResponseButton.tsx        # Hawk / Eagle / Bear / Speak buttons
├── lib/
│   └── api.ts                    # HTTP client
├── constants/
│   └── Colors.ts                 # Light / dark theme tokens
├── types/
│   └── index.ts                  # Shared TypeScript types
└── app.json                      # Expo config
```

### Tab 1 — Status (`index.tsx`)

- Device connected indicator (green / red)
- "Listening" state with animated waveform or pulse
- **Stop / Resume Monitoring** toggle button
  - Calls `POST /devices/{device_id}/control { action: "stop" | "start" }`
- Timestamp of last detection

### Tab 2 — History (`history.tsx`)

- **Incidents displayed prominently** — large cards showing time, deterrent used, duration
- Secondary feed below: on/off events, connection issues
- Pull-to-refresh

### Incident Response Screen (`incident/[id].tsx`)

Opened automatically via push notification deep-link when a detection occurs.

```
┌──────────────────────────────────────┐
│                                      │
│   🪵  WOODPECKER DETECTED!           │
│       How will you respond??         │
│                                      │
│  ┌────────────────────────────────┐  │
│  │  🦅  Hawk                      │  │
│  │      most recommended          │  │
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │  🦆  Eagle                     │  │
│  │      recommended for variety   │  │
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │  🐻  Bear                      │  │
│  │      most unexpected           │  │
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │  🎤  Speak directly            │  │
│  │      not recommended           │  │
│  └────────────────────────────────┘  │
│                                      │
└──────────────────────────────────────┘
```

Tapping a button:
1. `POST /incidents/{id}/respond { action: "hawk" | "eagle" | "bear" | "stream" }`
2. Shows brief confirmation
3. Navigates back to history tab

For "Speak directly": opens WebSocket to `/stream/{incident_id}` and streams phone mic audio in real time.

### TypeScript Types (`types/index.ts`)

```typescript
export interface Device {
    id: string;
    name?: string;
    is_monitoring: boolean;
    registered_at: string;
}

export interface Incident {
    id: number;
    device_id: string;
    detected_at: string;
    confidence: number;
    response_action?: "hawk" | "eagle" | "bear" | "stream" | null;
    responded_at?: string;
    audio_played?: string;
}
```

### API Client (`lib/api.ts`)

```typescript
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000";

export const api = {
    getDevice:       (id: string)           => apiGet<Device>(`/devices/${id}`),
    controlDevice:   (id: string, action)   => apiPost(`/devices/${id}/control`, { action }),
    getIncidents:    ()                     => apiGet<Incident[]>("/incidents"),
    getIncident:     (id: number)           => apiGet<Incident>(`/incidents/${id}`),
    respondToIncident: (id: number, action) => apiPost(`/incidents/${id}/respond`, { action }),
};
```

### Environment

```
EXPO_PUBLIC_API_URL=http://localhost:8000
EXPO_PUBLIC_DEVICE_ID=ph-aabbccddeeff
```

---

## End-to-End Communication Flow

```
Woodpecker drums on tree
        │
        ▼
  [INMP441 mic]
        │  16 kHz PCM samples
        ▼
  detect(&woodpeckerPattern)
        │  burst rate + amplitude match
        ▼
  POST /incidents ──────────────────────────▶ [Backend]
                                                   │  stores incident
                                                   │  sends push notification
                                                   ▼
                                            [Mobile App]
                                            incident/42 screen opens
                                                   │  user taps "Hawk"
                                                   ▼
                                    POST /incidents/42/respond {action:"hawk"}
                                                   │
                                            [Backend] marks incident responded
                                                   │
        ┌──────────────────────────────────────────┘
        │  poll returns {action:"hawk"}
        ▼
  GET /audio/hawk ──────────────────────────▶ [Backend]
        │  raw 16 kHz PCM
        ▼
  speaker_play_buffer_16k_mono()
        │
        ▼
  [Speaker: hawk call plays] 🦅
        │
        ▼
  detect(&woodpeckerPattern)   ◀── monitoring resumes
```

---

## Design Decisions

| Decision              | Choice                      | Reason                                                  |
|-----------------------|-----------------------------|---------------------------------------------------------|
| Detection algorithm   | Amplitude envelope + burst rate | Runs on ESP32, no heavy DSP / ML required           |
| Audio sample rate     | 16 kHz mono PCM             | Same as Someday Box; no codec overhead                  |
| Response protocol     | HTTP polling (2s, 30s TTL)  | Simpler than persistent connection; acceptable latency  |
| Audio streaming       | WebSocket PCM chunks        | Low-latency; native ESP-IDF WebSocket support           |
| Backend stack         | FastAPI + PostgreSQL         | Same as Someday Box                                     |
| Mobile framework      | Expo (React Native)         | Same as Someday Box                                     |
| Pinout strategy       | `pinout.h` single source    | Same pattern as Someday Box; auto-generates `PINOUT.md` |

---

## Development Setup

### Firmware

```bash
cd firmware
idf.py set-target esp32s3
idf.py menuconfig        # Configure WiFi credentials + API URL
idf.py build
idf.py -p COM9 flash monitor
```

### Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env     # Fill in DB credentials
uvicorn main:app --reload
```

### Web App

```bash
cd web-app
npm install
npm run dev
```

### Mobile App

```bash
cd mobile-app
npm install
npx expo start
```

### Regenerate Pinout Docs

```bash
python scripts/generate_pinout_docs.py
# Updates docs/PINOUT.md from @pinout tags in firmware/main/pinout.h
```
