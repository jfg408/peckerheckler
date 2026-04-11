import os
from dotenv import load_dotenv

load_dotenv()

AUDIO_DIR = os.getenv("AUDIO_DIR", "./audio")
VALID_SOUNDS = {"hawk", "eagle", "polar_bear"}


def get_sound_pcm(sound_name: str) -> bytes:
    if sound_name not in VALID_SOUNDS:
        raise ValueError(f"Unknown sound: {sound_name!r}. Valid: {VALID_SOUNDS}")
    path = os.path.join(AUDIO_DIR, f"{sound_name}.pcm")
    if not os.path.exists(path):
        raise FileNotFoundError(f"Audio file not found: {path}")
    with open(path, "rb") as f:
        return f.read()
