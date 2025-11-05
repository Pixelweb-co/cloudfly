import os, uuid, base64, subprocess, tempfile
from typing import Optional
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field
from TTS.api import TTS
import soundfile as sf
import numpy as np
import requests

TTS_MODEL = os.getenv("TTS_MODEL", "tts_models/multilingual/multi-dataset/xtts_v2")
SAMPLE_RATE = int(os.getenv("SAMPLE_RATE", "24000"))
DEFAULT_LANG = os.getenv("DEFAULT_LANG", "es")
OUTPUT_DIR = os.getenv("OUTPUT_DIR", "/data/outputs")
API_KEY = os.getenv("API_KEY", "").strip()

os.makedirs(OUTPUT_DIR, exist_ok=True)
tts = TTS(TTS_MODEL)

app = FastAPI(title="Local XTTS-v2 TTS API")

class TTSIn(BaseModel):
    text: str = Field(..., description="Texto a sintetizar")
    format: str = Field("mp3", regex="^(mp3|wav)$")
    language: Optional[str] = Field(None, description="Idioma (ej: 'es')")
    # Clonación de voz (opcional, cualquiera de los dos)
    voice_wav_url: Optional[str] = Field(None, description="URL de un WAV/MP3 de referencia")
    voice_wav_base64: Optional[str] = Field(None, description="Audio base64 (WAV/MP3)")
    # Control opcional de sample rate de salida
    sample_rate: Optional[int] = Field(None, description="Frecuencia de salida, por defecto 24000")

def require_key(x_api_key: Optional[str]):
    if API_KEY and (x_api_key or "") != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")

def load_reference_wav(voice_wav_url: Optional[str], voice_wav_base64: Optional[str]) -> Optional[str]:
    """
    Devuelve la ruta local de un WAV de referencia para clonación.
    Acepta URL (http/https) o base64 (WAV/MP3). Convierte a WAV si hace falta.
    """
    if not voice_wav_url and not voice_wav_base64:
        return None

    tmpdir = tempfile.mkdtemp()
    in_path = os.path.join(tmpdir, "in_audio")
    wav_path = os.path.join(tmpdir, "ref.wav")

    if voice_wav_url:
        r = requests.get(voice_wav_url, timeout=20)
        r.raise_for_status()
        with open(in_path, "wb") as f:
            f.write(r.content)
    else:
        raw = base64.b64decode(voice_wav_base64)
        with open(in_path, "wb") as f:
            f.write(raw)

    # Convertir a WAV 16-bit PCM con ffmpeg (seguro para el modelo)
    cmd = ["ffmpeg", "-y", "-i", in_path, "-ar", str(SAMPLE_RATE), "-ac", "1", wav_path]
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    return wav_path

def save_audio(wave: np.ndarray, sr: int, fmt: str) -> str:
    uid = str(uuid.uuid4())
    if fmt == "wav":
        out_path = os.path.join(OUTPUT_DIR, f"{uid}.wav")
        sf.write(out_path, wave, sr)
        return out_path

    # Guardar WAV temporal y convertir a MP3
    tmp_wav = os.path.join(OUTPUT_DIR, f"{uid}.wav")
    sf.write(tmp_wav, wave, sr)
    out_path = os.path.join(OUTPUT_DIR, f"{uid}.mp3")
    cmd = ["ffmpeg", "-y", "-i", tmp_wav, "-codec:a", "libmp3lame", "-b:a", "192k", out_path]
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    try:
        os.remove(tmp_wav)
    except:
        pass
    return out_path

@app.get("/health")
def health():
    return {"ok": True, "model": TTS_MODEL, "sr": SAMPLE_RATE}

@app.post("/tts")
def synth(in_: TTSIn, x_api_key: Optional[str] = Header(default=None)):
    require_key(x_api_key)

    lang = in_.language or DEFAULT_LANG
    sr = in_.sample_rate or SAMPLE_RATE

    ref_wav = load_reference_wav(in_.voice_wav_url, in_.voice_wav_base64)

    # XTTS-v2: clonación si ref_wav no es None
    if ref_wav:
        audio = tts.tts(text=in_.text, speaker_wav=ref_wav, language=lang)
    else:
        # Sin clonación: usa la voz por defecto del modelo (multilingüe)
        audio = tts.tts(text=in_.text, language=lang)

    out_path = save_audio(np.array(audio), sr, in_.format)
    # Puedes servir estático con Nginx o mapear /data como volumen para n8n
    return {"path": out_path, "format": in_.format, "sample_rate": sr, "language": lang}

# Endpoint que devuelve el binario directamente (útil si n8n quiere 'Response: File')
@app.post("/tts/file")
def synth_file(in_: TTSIn, x_api_key: Optional[str] = Header(default=None)):
    from fastapi.responses import FileResponse
    res = synth(in_, x_api_key)
    return FileResponse(res["path"], media_type="audio/mpeg" if res["format"]=="mp3" else "audio/wav",
                        filename=os.path.basename(res["path"]))
