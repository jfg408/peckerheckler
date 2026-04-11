import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()


def _conn():
    return psycopg2.connect(
        host=os.getenv("POSTGRES_HOST", "localhost"),
        port=int(os.getenv("POSTGRES_PORT", 5432)),
        dbname=os.getenv("POSTGRES_DB", "peckerheckler"),
        user=os.getenv("POSTGRES_USER", "postgres"),
        password=os.getenv("POSTGRES_PASSWORD", ""),
    )


def ensure_tables():
    with _conn() as conn, conn.cursor() as cur:
        cur.execute("""
            CREATE TABLE IF NOT EXISTS device (
                id            TEXT PRIMARY KEY,
                name          TEXT,
                is_monitoring BOOLEAN NOT NULL DEFAULT TRUE,
                registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        """)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS incident (
                id              SERIAL PRIMARY KEY,
                device_id       TEXT NOT NULL REFERENCES device(id),
                detected_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                confidence      REAL,
                response_action TEXT,
                responded_at    TIMESTAMPTZ,
                audio_played    TEXT
            )
        """)
        conn.commit()


# ---------- devices ----------

def upsert_device(device_id: str) -> dict:
    with _conn() as conn, conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            INSERT INTO device (id)
            VALUES (%s)
            ON CONFLICT (id) DO NOTHING
        """, (device_id,))
        cur.execute("SELECT * FROM device WHERE id = %s", (device_id,))
        row = cur.fetchone()
        conn.commit()
        return dict(row)


def get_device(device_id: str) -> dict | None:
    with _conn() as conn, conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT * FROM device WHERE id = %s", (device_id,))
        row = cur.fetchone()
        return dict(row) if row else None


def set_device_monitoring(device_id: str, monitoring: bool):
    with _conn() as conn, conn.cursor() as cur:
        cur.execute(
            "UPDATE device SET is_monitoring = %s WHERE id = %s",
            (monitoring, device_id),
        )
        conn.commit()


# ---------- incidents ----------

def create_incident(device_id: str, detected_at, confidence: float | None) -> dict:
    with _conn() as conn, conn.cursor(cursor_factory=RealDictCursor) as cur:
        upsert_device(device_id)  # auto-register on first contact
        if detected_at:
            cur.execute("""
                INSERT INTO incident (device_id, detected_at, confidence)
                VALUES (%s, %s, %s) RETURNING *
            """, (device_id, detected_at, confidence))
        else:
            cur.execute("""
                INSERT INTO incident (device_id, confidence)
                VALUES (%s, %s) RETURNING *
            """, (device_id, confidence))
        row = cur.fetchone()
        conn.commit()
        return dict(row)


def get_incidents(device_id: str | None = None) -> list[dict]:
    with _conn() as conn, conn.cursor(cursor_factory=RealDictCursor) as cur:
        if device_id:
            cur.execute(
                "SELECT * FROM incident WHERE device_id = %s ORDER BY detected_at DESC",
                (device_id,),
            )
        else:
            cur.execute("SELECT * FROM incident ORDER BY detected_at DESC")
        return [dict(r) for r in cur.fetchall()]


def get_incident(incident_id: int) -> dict | None:
    with _conn() as conn, conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT * FROM incident WHERE id = %s", (incident_id,))
        row = cur.fetchone()
        return dict(row) if row else None


def get_incident_response(incident_id: int) -> str | None:
    with _conn() as conn, conn.cursor() as cur:
        cur.execute(
            "SELECT response_action FROM incident WHERE id = %s",
            (incident_id,),
        )
        row = cur.fetchone()
        return row[0] if row else None


def count_polar_bear_today(device_id: str) -> int:
    with _conn() as conn, conn.cursor() as cur:
        cur.execute("""
            SELECT COUNT(*) FROM incident
             WHERE device_id       = %s
               AND response_action = 'polar_bear'
               AND responded_at::date = CURRENT_DATE
        """, (device_id,))
        return cur.fetchone()[0]


def set_incident_response(incident_id: int, action: str):
    with _conn() as conn, conn.cursor() as cur:
        cur.execute("""
            UPDATE incident
               SET response_action = %s,
                   responded_at    = NOW(),
                   audio_played    = %s
             WHERE id = %s
        """, (action, action, incident_id))
        conn.commit()
