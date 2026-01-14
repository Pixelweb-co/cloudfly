#!/usr/bin/env python3
"""
ARI Voice Bot - Real-time conversational AI bot for Asterisk
Handles bidirectional audio (RTP), STT, TTS, and n8n integration.
"""
import os
import json
import requests
import websocket
import threading
import time
import base64
import wave
import io
import socket
import struct
import audioop
from typing import Dict, Any, Optional
from collections import deque

# Configuration from environment variables
ARI_URL = os.getenv('ARI_URL', 'http://127.0.0.1:8088')
ARI_USER = os.getenv('ARI_USER', 'ariuser')
ARI_PASS = os.getenv('ARI_PASS', 'aripass')
STT_URL = os.getenv('STT_URL', 'http://127.0.0.1:8000')
TTS_URL = os.getenv('TTS_URL', 'http://127.0.0.1:5002')
N8N_WEBHOOK = os.getenv('N8N_WEBHOOK', 'http://localhost:5678/webhook/telefono-ia')
N8N_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzYTk4YmViMS00MDg2LTQ3YzYtOWE5YS02NjUwNzVlYjYzYTIiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY4MzQ4MTM4fQ.ANnR4m8U7OlnnJfb8cttYRy8-cKLFQvuuhBT1K44JCk"
N8N_API_BASE = os.getenv('N8N_API_BASE', 'https://autobot.cloudfly.com.co/api/v1')

# Webhooks por departamento
DEPT_WEBHOOKS = {
    'recepcion': os.getenv('WEBHOOK_RECEPCION', N8N_WEBHOOK),
    'ventas': os.getenv('WEBHOOK_VENTAS', 'http://localhost:5678/webhook/ventas-ia'),
    'soporte': os.getenv('WEBHOOK_SOPORTE', 'http://localhost:5678/webhook/soporte-ia'),
    'agendamiento': os.getenv('WEBHOOK_AGENDAMIENTO', 'http://localhost:5678/webhook/agendamiento-ia')
}


# Shared audio directory (mapped to /tmp/audio in docker-compose)
AUDIO_DIR = "/tmp/audio"

# ARI Application name
APP_NAME = 'voicebot'

# Audio settings
SAMPLE_RATE = 8000  # 8kHz for telephony
CHANNELS = 1        # Mono
SAMPLE_WIDTH = 2    # 16-bit
SILENCE_THRESHOLD = 500  # Reducido drásticamente para captar voces suaves
SILENCE_DURATION = 0.5   # Más rápido: procesa tras medio segundo de silencio
MAX_RECORDING_TIME = 10  # No esperar más de 10 segundos para procesar

# STT Configuration
WHISPER_MODEL = os.getenv('WHISPER_MODEL', 'base')


def get_local_ip():
    """Get the local IPv4 address of this container"""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        # doesn't even have to be reachable
        s.connect(('10.255.255.255', 1))
        IP = s.getsockname()[0]
    except Exception:
        IP = '127.0.0.1'
    finally:
        s.close()
    return IP

RTP_IP = get_local_ip()
print(f"🚀 Bot detected local IP: {RTP_IP}")
MAX_RECORDING_TIME = 20  # Max seconds before forcing STT

# RTP Settings
RTP_START_PORT = 11000

class RTPReceiver(threading.Thread):
    """Receives RTP packets via UDP and extracts audio payload (PCMU/G.711u)"""
    def __init__(self, port, callback):
        super().__init__()
        self.port = port
        self.callback = callback
        self.running = True
        self.sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self.sock.bind(('0.0.0.0', port))
        self.sock.settimeout(1.0)
        
    def run(self):
        print(f"🎤 RTP Receiver active on 0.0.0.0:{self.port} (Ready for {RTP_IP})")
        while self.running:
            try:
                data, addr = self.sock.recvfrom(2048)
                # print(f"DEBUG: Received {len(data)} bytes from {addr}") # Very noisy
                if len(data) > 12:  # Valid RTP header is at least 12 bytes
                    # Extract payload (skip 12 byte header)
                    payload = data[12:]
                    # Decode PCMU (G.711u) to Linear PCM (16-bit)
                    pcm_data = audioop.ulaw2lin(payload, 2)
                    self.callback(pcm_data)
            except socket.timeout:
                continue
            except Exception as e:
                if self.running:
                    print(f"❌ RTP Error: {e}")
    
    def stop(self):
        self.running = False
        self.sock.close()

class AudioBuffer:
    """Manages audio buffering and VAD"""
    def __init__(self):
        self.buffer = b''
        self.is_speaking = False
        self.last_speech_time = time.time()
        self.start_speech_time = None
        self.stt_busy = False # Flag to avoid overlapping STT per session
        
    def add_audio(self, pcm_data):
        """Add PCM audio to buffer and check VAD"""
        self.buffer += pcm_data
        
        # Simple amplitude VAD
        # Calculate RMS amplitude of the chunk
        try:
            rms = audioop.rms(pcm_data, 2)
        except:
            rms = 0
            
        if rms > SILENCE_THRESHOLD:
            if not self.is_speaking:
                self.is_speaking = True
                self.start_speech_time = time.time()
                # print("🗣️  Speech detected")
            self.last_speech_time = time.time()
        
    def should_process(self):
        """Check if we should process the buffer"""
        if not self.buffer:
            return False
            
        now = time.time()
        silence_duration = now - self.last_speech_time
        recording_duration = now - (self.start_speech_time or now)
        
        # Conditions to process:
        # 1. We were speaking, and now we've been silent long enough
        # 2. We've been recording for too long (force processing)
        
        if self.is_speaking and silence_duration > SILENCE_DURATION:
            # print(f"End of speech (Silence: {silence_duration:.2f}s)")
            return True
            
        if self.is_speaking and recording_duration > MAX_RECORDING_TIME:
            print("Force processing (Max duration reached)")
            return True
            
        return False
        
    def get_audio(self):
        """Get audio and reset"""
        audio = self.buffer
        self.buffer = b''
        self.is_speaking = False
        self.start_speech_time = None
        return audio

class CallSession:
    """Manages a single call session"""
    def __init__(self, channel_id, caller_number, bot, context_data=None):
        self.channel_id = channel_id
        self.caller_number = caller_number
        self.bot = bot
        self.context_data = context_data or {}
        self.start_time = time.time()
        self.audio_buffer = AudioBuffer()
        self.conversation_context = []
        self.is_playing = False
        self.current_playback_id = None
        self.rtp_port = 0
        self.rtp_receiver = None
        self.snoop_channel_id = None
        self.external_media_channel_id = None
        self.stt_busy = False # Flag to avoid overlapping STT per session
        self.lock = threading.Lock() # Lock to prevent race conditions in on_audio_data
        self.n8n_check_lock = threading.Lock()
        
    def is_n8n_busy(self):
        """Check if n8n is still processing an execution for this call_id"""
        if not N8N_API_KEY:
            return False
            
        try:
            # safe_call_id is channel_id with underscores
            safe_id = self.channel_id.replace('.', '_')
            
            # Request n8n executions to see if there are active ones
            # Status can be: 'waiting', 'running', 'success', 'failed'
            headers = {'X-N8N-API-KEY': N8N_API_KEY}
            params = {
                'limit': 5,
                'status': 'running' 
            }
            # Note: The public API doesn't filter directly by sessionId/call_id well,
            # so we'll just check if any are 'running'. Or we can just rely on stt_busy.
            # However, for 'waiting' status:
            res = requests.get(f"{N8N_API_BASE}/executions", headers=headers, params={'status': 'running'}, timeout=3)
            if res.status_code == 200:
                data = res.json()
                if data.get('data') and len(data['data']) > 0:
                    # In a high traffic system, we'd need to check if execution belongs to this call_id
                    # but for now, any running execution means we should wait.
                    return True
            return False
        except:
            return False
        
    def setup_media_server(self):
        """Sets up local RTP receiver and snoops the call audio"""
        try:
            # Find a free port
            sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            sock.bind(('', 0))
            self.rtp_port = sock.getsockname()[1]
            sock.close()
            
            # Start RTP Receiver
            self.rtp_receiver = RTPReceiver(self.rtp_port, self.on_audio_data)
            self.rtp_receiver.start()
            
            # SNOOP the channel to get audio
            # This tells Asterisk to create a new channel that "listens" to the original one
            # and sends that audio to an external host (our bot)
            print(f"🔗 Snooping channel {self.channel_id} to {RTP_IP}:{self.rtp_port}")
            url = f"{self.bot.base_url}/channels/{self.channel_id}/snoop"
            params = {
                'app': APP_NAME,
                'spy': 'in',       # Listen to audio coming FROM the user
                'whisper': 'none', # We don't need to talk back via this channel
                'appArgs': 'snooper'
            }
            # We also need to create an External Media channel to receive the snooped audio
            # Actually, Snoop can directly send to externalMedia if we bridge it, 
            # but simpler: Snoop -> ExternalMedia
            
            # 1. Create External Media channel
            media_url = f"{self.bot.base_url}/channels/externalMedia"
            media_params = {
                'app': APP_NAME,
                'external_host': f'{RTP_IP}:{self.rtp_port}',
                'format': 'ulaw'
            }
            res = requests.post(media_url, auth=self.bot.auth, json=media_params)
            if res.status_code > 299:
                print(f"❌ External Media Error: {res.status_code} {res.text}")
                return
            
            self.external_media_channel_id = res.json().get('id')
            
            # 2. Create a mixing bridge to connect them
            bridge_url = f"{self.bot.base_url}/bridges"
            res = requests.post(bridge_url, auth=self.bot.auth, json={'type': 'mixing'})
            bridge_id = res.json()['id']
            
            # 3. Add External Media to bridge
            requests.post(f"{self.bot.base_url}/bridges/{bridge_id}/addChannel", 
                          auth=self.bot.auth, params={'channel': self.external_media_channel_id})
            
            # 4. Snoop the original channel and put the snoop-channel into the bridge
            snoop_res = requests.post(url, auth=self.bot.auth, params=params)
            if snoop_res.status_code > 299:
                print(f"❌ Snoop Error: {snoop_res.status_code} {snoop_res.text}")
                return
                
            snoop_id = snoop_res.json()['id']
            res = requests.post(f"{self.bot.base_url}/bridges/{bridge_id}/addChannel", 
                          auth=self.bot.auth, params={'channel': snoop_id})
            if res.status_code > 299:
                 print(f"❌ Bridge Add Snoop Error: {res.status_code} {res.text}")
            
            print(f"✅ Audio pipeline established (Port: {self.rtp_port})")
            
        except Exception as e:
            print(f"❌ Error setting up media: {e}")
            # Fallback to pure Snoop if bridge/external media fails?
            
    def on_audio_data(self, pcm_data):
        """Callback for new audio data"""
        try:
            # 1. Detect barge-in (Is user speaking while bot is talking?)
            if self.is_playing:
                try:
                    rms = audioop.rms(pcm_data, 2)
                    if rms > (SILENCE_THRESHOLD * 1.5): # Slightly higher threshold for barge-in
                        print(f"🛑 [Barge-in] User interrupted! Stopping playback.")
                        self.stop_current_playback()
                except:
                    pass

            # Aumentar volumen (Ganancia 4x) para mejorar comprensión de Whisper
            try:
                # Multiplicamos la amplitud por 4.0 (Aumentamos ganancia para Whisper)
                pcm_data = audioop.mul(pcm_data, 2, 4.0)
            except:
                pass

            # 2. Add to buffer for STT
            self.audio_buffer.add_audio(pcm_data)
            
            # 3. Trigger STT if silence detected
            with self.lock:
                if self.audio_buffer.should_process() and not self.stt_busy:
                    # Check n8n API before starting new processing
                    # This prevents overlapping "Double AI Responses"
                    if self.is_n8n_busy():
                        print(f"⏳ [Session {self.channel_id}] n8n is still busy. Waiting for next silence cycle...", flush=True)
                        return

                    audio_to_process = self.audio_buffer.get_audio()
                    if len(audio_to_process) >= 2000:
                        self.stt_busy = True 
                        print(f"✅ [Session {self.channel_id}] Audio chunk ready! Length: {len(audio_to_process)}", flush=True)
                        threading.Thread(target=self.process_audio_chunk, args=(audio_to_process,)).start()

        except Exception as e:
            print(f"🔥 RTP Callback Error: {e}", flush=True)

    def stop_current_playback(self):
        """Stops the current audio playback if any"""
        if self.current_playback_id:
            print(f"⏹️ Stopping playback {self.current_playback_id}")
            self.bot.stop_playback(self.current_playback_id)
            self.current_playback_id = None
            self.is_playing = False
                
    def process_audio_chunk(self, audio_data):
        """Process collected audio"""
        start_ts = time.time()
        # audio_data is now passed as an argument to avoid race conditions
        if not audio_data:
            self.stt_busy = False
            return
            
        try:
            # Save to temporary WAV
            wav_buffer = io.BytesIO()
            with wave.open(wav_buffer, 'wb') as wav_file:
                wav_file.setnchannels(CHANNELS)
                wav_file.setsampwidth(SAMPLE_WIDTH)
                wav_file.setframerate(SAMPLE_RATE)
                wav_file.writeframes(audio_data)
            wav_buffer.seek(0)
            
            # STT Request
            stt_req_start = time.time()
            print(f"🎤 [Session {self.channel_id}] Sending to STT... (Delay: {stt_req_start - start_ts:.3f}s)", flush=True)
            
            response = requests.post(
                f"{STT_URL}/v1/audio/transcriptions",
                files={'file': ('audio.wav', wav_buffer, 'audio/wav')},
                data={'model': WHISPER_MODEL, 'language': 'es', 'temperature': 0.0},
                timeout=45
            )
            print(f"⏱️  STT Request Latency: {time.time() - stt_req_start:.3f}s", flush=True)
            
            if response.status_code == 200:
                text = response.json().get('text', '').strip()
                if text:
                    print(f"🗣️  User said: '{text}'", flush=True)
                    self.handle_user_input(text)
            else:
                print(f"⚠️ STT Error: {response.status_code} {response.text}")
                
        except Exception as e:
            print(f"❌ Processing error: {e}")
        finally:
            self.stt_busy = False

    def handle_user_input(self, text, is_initial=False):
        """Send to n8n and reply"""
        # Barge-in handled by 'is_playing' check in on_audio_data normally,
        # but if we are here, we finished recording.
        
        try:
            # Build payload
            self.conversation_context.append({'role': 'user', 'content': text})
            
            # Use a dot-free ID for better URL compatibility with some web servers/n8n
            safe_call_id = self.channel_id.replace('.', '_')
            
            payload = {
                'call_id': safe_call_id,
                'caller': self.caller_number,
                'text': text,
                'context': self.conversation_context[-5:],
                'metadata': self.context_data, # Send initial context data
                'is_initial': is_initial
            }
            
            print(f"🤖 User Input -> n8n...", flush=True)
            
            # Determinar el webhook según el departamento
            dept = self.context_data.get('dept', 'recepcion')
            webhook_url = DEPT_WEBHOOKS.get(dept, N8N_WEBHOOK)
            print(f"📡 Using webhook for {dept}: {webhook_url}")

            response = requests.post(webhook_url, json=payload, timeout=45)

            print(f"📡 n8n Status: {response.status_code}", flush=True)
            
            if response.status_code == 200:
                print(f"📡 n8n RAW Response: '{response.text}'", flush=True) # Debug raw response
                try:
                    resp_json = response.json()
                    bot_response = resp_json.get('response', resp_json.get('text', resp_json.get('output', 'No entendí.')))
                    print(f"🤖 Bot reply: '{bot_response}'", flush=True)
                    
                    self.conversation_context.append({'role': 'assistant', 'content': bot_response})
                    self.speak(bot_response)
                except Exception as json_err:
                    print(f"❌ n8n JSON Parse Error: {json_err} | Content: {response.text}", flush=True)
                    self.speak("Error procesando la respuesta del cerebro.")
            else:
                print(f"❌ n8n Webhook Error: {response.status_code} {response.text}", flush=True)
        except Exception as e:
            print(f"❌ n8n Error: {e}", flush=True)
            self.speak("Se cae la señal puedes repertirme por favor.")

    def speak(self, text):
        """Generate TTS and play"""
        print(f"🔊 Calling speak() with: '{text[:30]}...'", flush=True)
        try:
            self.is_playing = True
            
            # TTS Request
            # We use tts_models/es/css10/vits which is single speaker.
            # So we should NOT send speaker_id or language_id.
            
            print(f"🗣️  Generating TTS for: '{text}'")
            try:
                tts_start = time.time()
                # Reverting to simple params for css10/vits
                response = requests.get(
                    f"{TTS_URL}/api/tts",
                    params={'text': text},
                    timeout=30 
                )
                print(f"⏱️  TTS Request Latency: {time.time() - tts_start:.3f}s", flush=True)

            except requests.exceptions.Timeout:
                print("❌ TTS Timeout")
                self.is_playing = False
                return
            except Exception as e:
                print(f"❌ TTS Connection Error: {e}")
                self.is_playing = False
                return

            if response.status_code == 200:
                # The TTS returns 22050Hz mono 16-bit audio.
                # Asterisk wav format typically expects 8000Hz.
                audio_data = response.content
                
                try:
                    resample_start = time.time()
                    # Resample from 22050 to 8000
                    # ratecv(data, width, nchannels, inrate, outrate, state[, weightA[, weightB]])
                    converted_audio, _ = audioop.ratecv(audio_data, 2, 1, 22050, 8000, None)
                    audio_data = converted_audio
                    print(f"🔄 Resampled audio (22050->8000) in {time.time() - resample_start:.4f}s", flush=True)
                except Exception as e:
                    print(f"⚠️ Resampling failed: {e}")

                # Save to shared volume
                filename = f"tts_{self.channel_id}_{int(time.time())}.wav"
                filepath = os.path.join(AUDIO_DIR, filename)
                
                with wave.open(filepath, 'wb') as wf:
                    wf.setnchannels(1)
                    wf.setsampwidth(2)
                    wf.setframerate(8000)
                    wf.writeframes(audio_data)
                
                print(f"💾 Audio saved and converted to {filepath}")
                
                # Tell Asterisk to play it
                # Asterisk sees it at /tmp/audio/{filename}
                # format is usually 'sound:/tmp/audio/filename' without extension
                playback_path = f"/tmp/audio/{filename[:-4]}"
                
                self.current_playback_id = self.bot.play_audio(self.channel_id, playback_path)
            else:
                print(f"❌ TTS Error: {response.status_code} {response.text}")
                self.is_playing = False
                
        except Exception as e:
            print(f"❌ Speak Error: {e}")
            self.is_playing = False

    def close(self):
        """Cleanup"""
        if self.rtp_receiver:
            self.rtp_receiver.stop()
        # Clean up External Media channel?
        # When main channel hangs up, the bridge usually destroys or we should hangup external channel.
        if self.external_media_channel_id:
            try:
                requests.delete(f"{self.bot.base_url}/channels/{self.external_media_channel_id}", auth=self.bot.auth)
            except:
                pass


class ARIBot:
    """Main ARI Application"""
    def __init__(self):
        self.base_url = f"{ARI_URL}/ari"
        self.auth = (ARI_USER, ARI_PASS)
        self.sessions: Dict[str, CallSession] = {}
        
        # Ensure audio dir exists
        os.makedirs(AUDIO_DIR, exist_ok=True)
        
    def start(self):
        print(f"📡 Connecting to Asterisk ARI at {ARI_URL}...")
        
        ws_url = f"{ARI_URL.replace('http://', 'ws://').replace('https://', 'wss://')}/ari/events?app={APP_NAME}&subscribeAll=true"
        
        # Basic Auth
        auth_str = f"{ARI_USER}:{ARI_PASS}"
        auth_b64 = base64.b64encode(auth_str.encode('ascii')).decode('ascii')
        
        ws = websocket.WebSocketApp(
            ws_url,
            on_message=self.on_message,
            on_error=self.on_error,
            on_close=self.on_close,
            on_open=self.on_open,
            header=[f"Authorization: Basic {auth_b64}"]
        )
        ws.run_forever()

    def on_open(self, ws):
        print("✅ ARI WebSocket Connected. Waiting for calls...")

    def on_message(self, ws, message):
        try:
            event = json.loads(message)
            etype = event.get('type')
            print(f"📥 Received event: {etype}")
            
            if etype == 'StasisStart':
                self.handle_stasis_start(event)
            elif etype == 'StasisEnd':
                self.handle_stasis_end(event)
            elif etype == 'PlaybackFinished':
                self.handle_playback_finished(event)
                
        except Exception as e:
            print(f"⚠️ Event Error: {e}")

    def on_error(self, ws, error):
        print(f"❌ WebSocket Error: {error}")

    def on_close(self, ws, code, msg):
        print("🔌 WebSocket Closed")

    def handle_stasis_start(self, event):
        channel = event['channel']
        cid = channel['id']
        chan_name = channel.get('name', '')
        caller = channel.get('caller', {}).get('number', 'Unknown')
        
        print(f"📞 Channel Info - ID: {cid}, Name: {chan_name}")

        # If this is our own media or snoop channel, ignore it
        if 'ExternalMedia' in chan_name or 'UnicastRTP' in chan_name or 'Snoop' in chan_name:
            print(f"⏩ Ignoring technical channel: {chan_name}")
            return

        if cid in self.sessions:
            print(f"⚠️ Session {cid} already exists. Skipping duplicate StasisStart.")
            return

        print(f"📞 NEW CALL from {caller} (Channel: {cid})")
        
        # 1. Parse args into a dictionary FIRST
        args_list = event.get('args', [])
        context_data = {}
        for arg in args_list:
            if '=' in arg:
                key, val = arg.split('=', 1)
                context_data[key.strip()] = val.strip()
        
        print(f"📋 Call Args: {args_list}")
        print(f"📋 Parsed Context: {context_data}")

        # 2. Answer the channel
        requests.post(f"{self.base_url}/channels/{cid}/answer", auth=self.auth)
        
        # 3. Create Session with context (ONLY ONCE)
        session = CallSession(cid, caller, self, context_data)
        self.sessions[cid] = session
        
        # 4. Setup RTP Listening (ONLY ONCE)
        session.setup_media_server()
        
        # Initial Greeting
        time.sleep(1.0) 
        
        # Logic based on department
        dept = context_data.get('dept', 'recepcion')
        
        if 'agent_context' in context_data:
            print(f"🤖 [Dept: {dept}] Triggering AI initial greeting via n8n...")
            initial_prompt = f"[SYSTEM_INIT] Contexto: {context_data.get('agent_context')}. Cliente: {context_data.get('customer_name')}. Genera el saludo inicial. NO saludes como asistente genérico. REGLA: Sé breve, máximo 2 frases."
            session.handle_user_input(initial_prompt, is_initial=True)
        else:
            print(f"📢 [Dept: {dept}] Using standardized greeting")
            if dept == 'ventas':
                session.speak("Hola, bienvenido a Cloudfly, le habla su asesor de ventas. ¿Cómo se encuentra el día de hoy? ¿En qué puedo ayudarle?")
            elif dept == 'soporte':
                session.speak("Hola, bienvenido a Cloudfly, le habla su técnico de soporte. ¿Cómo se encuentra el día de hoy? ¿En qué puedo ayudarle?")
            elif dept == 'agendamiento':
                session.speak("Hola, bienvenido a Cloudfly, le habla su asistente de citas. ¿Cómo se encuentra el día de hoy? ¿En qué puedo ayudarle?")
            else:
                # Recepción o default
                session.speak("Hola, bienvenido a Cloudfly, le habla Laura de recepción. ¿Cómo se encuentra el día de hoy? ¿En qué puedo ayudarle?")



    def handle_stasis_end(self, event):
        cid = event['channel']['id']
        if cid in self.sessions:
            print(f"👋 Call ended: {cid}")
            self.sessions[cid].close()
            del self.sessions[cid]

    def handle_playback_finished(self, event):
        uri = event['playback']['target_uri']
        cid = uri.split('/')[-1]
        
        if cid in self.sessions:
            self.sessions[cid].is_playing = False
            # print("▶️  Playback finished")

    def play_audio(self, channel_id, path):
        """Play audio file"""
        try:
            media_uri = f'sound:{path}'
            print(f"▶️ Playing {media_uri} on channel {channel_id}...")
            res = requests.post(
                f"{self.base_url}/channels/{channel_id}/play",
                auth=self.auth,
                params={'media': media_uri}
            )
            print(f"▶️ Play Response: {res.status_code} {res.text}")
            return res.json().get('id')
        except Exception as e:
            print(f"❌ Play Error: {e}")
            return None

    def stop_playback(self, playback_id):
        """Stop an ongoing playback"""
        try:
            res = requests.delete(
                f"{self.base_url}/playbacks/{playback_id}",
                auth=self.auth
            )
            return res.status_code == 204
        except Exception as e:
            print(f"❌ Stop Playback Error: {e}")
            return False

if __name__ == '__main__':
    # Wait for Asterisk to be fully ready
    time.sleep(5)
    
    bot = ARIBot()
    while True:
        try:
            bot.start()
        except Exception as e:
            print(f"🔥 Bot Crash/Exit: {e}")
            time.sleep(5)
