#!/usr/bin/env python3
"""
ARI Voice Bot v2 - Real-time conversational AI bot for Asterisk
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
import audioop
import edge_tts
import asyncio
from typing import Dict, Any
from datetime import datetime

# Configuration from environment variables
ARI_URL = os.getenv('ARI_URL', 'http://asterisk:8088')
ARI_USER = os.getenv('ARI_USER', 'ariuser')
ARI_PASS = os.getenv('ARI_PASS', 'aripass')
STT_URL = os.getenv('STT_URL', 'http://stt:8000')
TTS_URL = os.getenv('TTS_URL', 'http://tts:5002')
N8N_WEBHOOK = os.getenv('N8N_WEBHOOK', 'https://autobot.cloudfly.com.co/webhook/telefono-ia')
N8N_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzYTk4YmViMS00MDg2LTQ3YzYtOWE5YS02NjUwNzVlYjYzYTIiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY4MzQ4MTM4fQ.ANnR4m8U7OlnnJfb8cttYRy8-cKLFQvuuhBT1K44JCk"
N8N_API_BASE = os.getenv('N8N_API_BASE', 'https://autobot.cloudfly.com.co/api/v1')

# Webhooks por departamento
DEPT_WEBHOOKS = {
    'recepcion': os.getenv('WEBHOOK_RECEPCION', N8N_WEBHOOK),
    'ventas': os.getenv('WEBHOOK_VENTAS', 'http://localhost:5678/webhook/ventas-ia'),
    'soporte': os.getenv('WEBHOOK_SOPORTE', 'http://localhost:5678/webhook/soporte-ia'),
    'agendamiento': os.getenv('WEBHOOK_AGENDAMIENTO', 'http://localhost:5678/webhook/agendamiento-ia')
}

AUDIO_DIR = "/tmp/audio"
APP_NAME = 'voicebot'

# Audio settings
SAMPLE_RATE = 8000
CHANNELS = 1
SAMPLE_WIDTH = 2
SILENCE_THRESHOLD = 500
SILENCE_DURATION = 0.5
MAX_RECORDING_TIME = 20

# STT Configuration
WHISPER_MODEL = os.getenv('WHISPER_MODEL', 'tiny')



def get_local_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('10.255.255.255', 1))
        IP = s.getsockname()[0]
    except Exception:
        IP = '127.0.0.1'
    finally:
        s.close()
    return IP

RTP_IP = get_local_ip()

class RTPReceiver(threading.Thread):
    def __init__(self, port, callback):
        super().__init__()
        self.port = port
        self.callback = callback
        self.running = True
        self.sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self.sock.bind(('0.0.0.0', port))
        self.sock.settimeout(1.0)
        
    def run(self):
        print(f"🎤 RTP Receiver active on 0.0.0.0:{self.port} (IP: {RTP_IP})")
        while self.running:
            try:
                data, addr = self.sock.recvfrom(2048)
                if len(data) > 12:
                    payload = data[12:]
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
    def __init__(self):
        self.buffer = b''
        self.is_speaking = False
        self.last_speech_time = time.time()
        self.start_speech_time = None
        
    def add_audio(self, pcm_data):
        self.buffer += pcm_data
        try:
            rms = audioop.rms(pcm_data, 2)
        except: rms = 0
            
        if rms > SILENCE_THRESHOLD:
            if not self.is_speaking:
                self.is_speaking = True
                self.start_speech_time = time.time()
            self.last_speech_time = time.time()
        
    def should_process(self):
        if not self.buffer: return False
        now = time.time()
        silence_duration = now - self.last_speech_time
        recording_duration = now - (self.start_speech_time or now)
        
        if self.is_speaking and silence_duration > SILENCE_DURATION: return True
        if self.is_speaking and recording_duration > MAX_RECORDING_TIME: return True
        return False
        
    def get_audio(self):
        audio = self.buffer
        self.buffer = b''
        self.is_speaking = False
        self.start_speech_time = None
        return audio

class CallSession:
    def __init__(self, channel_id, caller_number, bot, context_data=None):
        self.channel_id = channel_id
        self.caller_number = caller_number
        self.bot = bot
        self.context_data = context_data or {}
        self.audio_buffer = AudioBuffer()
        self.conversation_context = []
        self.is_playing = False
        self.current_playback_id = None
        self.rtp_port = 0
        self.rtp_receiver = None
        self.external_media_channel_id = None
        self.stt_busy = False
        self.dtmf_buffer = ""
        self.lock = threading.Lock()
        
        # Inactivity Timer (30s)
        self.inactivity_timer = None
        self.reset_inactivity_timer()

    def reset_inactivity_timer(self):
        if self.inactivity_timer: self.inactivity_timer.cancel()
        self.inactivity_timer = threading.Timer(60.0, self.handle_inactivity_timeout)
        self.inactivity_timer.start()

    def handle_inactivity_timeout(self):
        print(f"⏰ Inactivity Timeout for {self.channel_id}")
        try:
            self.speak("Parece que no hay actividad. Voy a finalizar la llamada. ¡Hasta luego!")
            time.sleep(10) # Wait for TTS to start/finish
            requests.delete(f"{self.bot.base_url}/channels/{self.channel_id}", auth=self.bot.auth)
        except: pass
        
    def is_n8n_busy(self):
        if not N8N_API_KEY: return False
        try:
            headers = {'X-N8N-API-KEY': N8N_API_KEY}
            res = requests.get(f"{N8N_API_BASE}/executions", headers=headers, params={'status': 'running'}, timeout=3)
            if res.status_code == 200:
                data = res.json()
                return data.get('data') and len(data['data']) > 0
            return False
        except: return False
        
    def setup_media_server(self):
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            sock.bind(('', 0))
            self.rtp_port = sock.getsockname()[1]
            sock.close()
            self.rtp_receiver = RTPReceiver(self.rtp_port, self.on_audio_data)
            self.rtp_receiver.start()
            
            # External Media
            res = requests.post(f"{self.bot.base_url}/channels/externalMedia", auth=self.bot.auth, 
                               json={'app': APP_NAME, 'external_host': f'{RTP_IP}:{self.rtp_port}', 'format': 'ulaw'})
            if res.status_code > 299: return
            self.external_media_channel_id = res.json().get('id')
            
            # Bridge
            res = requests.post(f"{self.bot.base_url}/bridges", auth=self.bot.auth, json={'type': 'mixing'})
            bridge_id = res.json()['id']
            
            requests.post(f"{self.bot.base_url}/bridges/{bridge_id}/addChannel", auth=self.bot.auth, params={'channel': self.external_media_channel_id})
            
            # Snoop
            snoop_res = requests.post(f"{self.bot.base_url}/channels/{self.channel_id}/snoop", auth=self.bot.auth, 
                                     params={'app': APP_NAME, 'spy': 'in', 'whisper': 'none', 'appArgs': 'snooper'})
            if snoop_res.status_code > 299: return
            snoop_id = snoop_res.json()['id']
            requests.post(f"{self.bot.base_url}/bridges/{bridge_id}/addChannel", auth=self.bot.auth, params={'channel': snoop_id})
            print(f"✅ Pipeline OK for {self.channel_id}")
        except Exception as e: print(f"❌ Media Error: {e}")

    def on_audio_data(self, pcm_data):
        try:
            if self.is_playing:
                rms = audioop.rms(pcm_data, 2)
                if rms > (SILENCE_THRESHOLD * 1.5): self.stop_current_playback()
            pcm_data = audioop.mul(pcm_data, 2, 4.0)
            self.audio_buffer.add_audio(pcm_data)
            with self.lock:
                if self.audio_buffer.should_process() and not self.stt_busy:
                    if self.is_n8n_busy(): return
                    audio_to_process = self.audio_buffer.get_audio()
                    if len(audio_to_process) >= 2000:
                        self.stt_busy = True 
                        threading.Thread(target=self.process_audio_chunk, args=(audio_to_process,)).start()
        except Exception as e: print(f"🔥 RTP Callback Error: {e}")

    def handle_dtmf(self, digit):
        """Handle keypad input with auto-submit timeout"""
        # Cancelar timer existente si hay uno corriendo
        if hasattr(self, 'dtmf_timer') and self.dtmf_timer:
            self.dtmf_timer.cancel()

        if digit == '#':
            self.submit_dtmf()
        elif digit == '*':
            print("🎹 DTMF Clear")
            self.dtmf_buffer = ""
        else:
            self.dtmf_buffer += digit
            print(f"🎹 DTMF Buffer: {self.dtmf_buffer}")
            # Iniciar nuevo timer de 3 segundos para auto-envío
            self.dtmf_timer = threading.Timer(3.0, self.submit_dtmf)
            self.dtmf_timer.start()

    def submit_dtmf(self):
        """Envia el buffer DTMF a n8n"""
        if self.dtmf_buffer:
            print(f"🎹 DTMF Submit: {self.dtmf_buffer}")
            val = self.dtmf_buffer
            self.dtmf_buffer = ""
            # Ejecutar en thread aparte para no bloquear
            threading.Thread(target=self.handle_user_input, args=(val,)).start()

    def stop_current_playback(self):
        if self.current_playback_id:
            self.bot.stop_playback(self.current_playback_id)
            self.current_playback_id = None
            self.is_playing = False
                
    def process_audio_chunk(self, audio_data):
        try:
            wav_buffer = io.BytesIO()
            with wave.open(wav_buffer, 'wb') as wf:
                wf.setnchannels(CHANNELS); wf.setsampwidth(SAMPLE_WIDTH); wf.setframerate(SAMPLE_RATE)
                wf.writeframes(audio_data)
            wav_buffer.seek(0)
            
            response = requests.post(f"{STT_URL}/v1/audio/transcriptions", files={'file': ('audio.wav', wav_buffer, 'audio/wav')},
                                    data={'model': WHISPER_MODEL, 'language': 'es', 'temperature': 0.0}, timeout=60)

            if response.status_code == 200:
                text = response.json().get('text', '').strip()
                if text:
                    # Filtro anti-alucinaciones mejorado
                    clean_text = ''.join(c for c in text.lower() if c.isalpha())
                    distinct_letters = len(set(clean_text))
                    words = text.lower().split()
                    is_hallucination = False
                    
                    # Caso 1: Mucha repetición o frase con muy pocas letras distintas (ej: "no no no", "si si")
                    if distinct_letters <= 3:
                        is_hallucination = True
                    
                    # Caso 2: Palabras basura comunes de Whisper en silencio
                    hallucination_phrases = ["gracias por ver", "suscríbete", "subtitles by", "gracias.", "gracias por ver.", "suscríbete."] 
                    if text.lower() in hallucination_phrases:
                        is_hallucination = True

                    if is_hallucination:
                        print(f"🚫 Hallucination suspected ({distinct_letters} letters): {text}")
                        # Don't speak, just ignore or log
                        return


                    print(f"👤 User: {text}")
                    self.handle_user_input(text)
        except Exception as e: print(f"❌ STT Error: {e}")
        finally: self.stt_busy = False

    def handle_user_input(self, text, is_initial=False):
        try:
            self.reset_inactivity_timer()
            self.conversation_context.append({'role': 'user', 'content': text})
            safe_call_id = self.channel_id.replace('.', '_')
            
            # Routing de Webhooks por Departamento
            dept = self.context_data.get('dept', 'recepcion')
            base_webhook = N8N_WEBHOOK
            
            # Si el webhook base termina en 'telefono-ia', asumimos estructura estándar
            webhook_url = base_webhook
            if 'telefono-ia' in base_webhook:
                if dept == 'ventas': webhook_url = base_webhook.replace('telefono-ia', 'ventas-ia')
                elif dept == 'soporte': webhook_url = base_webhook.replace('telefono-ia', 'soporte-ia')
                elif dept == 'agendamiento': webhook_url = base_webhook.replace('telefono-ia', 'agendamiento-ia')
            
            # Override por variable de entorno si existe
            if dept == 'ventas' and os.getenv('WEBHOOK_VENTAS'): webhook_url = os.getenv('WEBHOOK_VENTAS')

            print(f"🌍 Routing to n8n [{dept}]: {webhook_url}")

            payload = {
                'call_id': safe_call_id, 'caller': self.caller_number, 'text': text,
                'context': self.conversation_context[-5:], 'metadata': self.context_data, 'is_initial': is_initial,
                'department': dept
            }
            
            response = requests.post(webhook_url, json=payload, timeout=45)

            if response.status_code == 200:
                try:
                    resp_json = response.json()
                    bot_response = resp_json.get('response', resp_json.get('text', resp_json.get('output', 'Lo siento, no pude procesar eso.')))
                    print(f"🤖 Bot: {bot_response}")
                    self.conversation_context.append({'role': 'assistant', 'content': bot_response})
                    self.speak(bot_response)
                except: self.speak("Error al interpretar la respuesta.")
            else: print(f"❌ Webhook Error: {response.status_code}")
        except Exception as e:
            print(f"❌ n8n Error: {e}")
            self.speak("Perdón, tuve un problema de conexión. ¿Puedes repetir?")

    def _generate_edge_tts(self, text, voice):
        """Helper to run async edge-tts in sync way"""
        async def _gen():
            communicate = edge_tts.Communicate(text, voice)
            audio_data = b""
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    audio_data += chunk["data"]
            return audio_data
        
        try:
            return asyncio.run(_gen())
        except Exception as e:
            print(f"❌ Edge-TTS Error: {e}")
            return None

    def generate_audio_file(self, text):
        try:
            # Selección de Voz Colombiana
            dept = self.context_data.get('dept', 'recepcion')
            if dept == 'ventas':
                voice = "es-CO-GonzaloNeural" # Hombre Colombiano
            else:
                voice = "es-CO-SalomeNeural" # Mujer Colombiana
            
            mp3_data = self._generate_edge_tts(text, voice)
            
            if mp3_data:
                mp3_filename = f"/tmp/tts_{self.channel_id}.mp3"
                timestamp = int(time.time() * 1000) # Más precisión
                wav_filename = f"/tmp/audio/tts_{self.channel_id}_{timestamp}.wav"
                
                with open(mp3_filename, "wb") as f: f.write(mp3_data)
                
                # Convertir MP3 a WAV 8000Hz
                os.system(f"ffmpeg -y -i {mp3_filename} -ar 8000 -ac 1 -c:a pcm_s16le {wav_filename} > /dev/null 2>&1")
                try: os.remove(mp3_filename)
                except: pass
                
                return wav_filename[:-4] # Sin extensión para Asterisk
            return None
        except Exception as e:
            print(f"❌ Generate Audio Error: {e}")
            return None

    def play_existing_file(self, path_no_ext):
        if not path_no_ext: return
        self.is_playing = True
        self.current_playback_id = self.bot.play_audio(self.channel_id, path_no_ext)

    def speak(self, text):
        path = self.generate_audio_file(text)
        if path: self.play_existing_file(path)

    def get_n8n_init_text(self):
        """Síncrono: Obtiene texto inicial de n8n"""
        try:
            # Reutiliza lógica de routing
            dept = self.context_data.get('dept', 'recepcion')
            base_webhook = N8N_WEBHOOK
            webhook_url = base_webhook
            if 'telefono-ia' in base_webhook:
                if dept == 'ventas': webhook_url = base_webhook.replace('telefono-ia', 'ventas-ia')
                elif dept == 'soporte': webhook_url = base_webhook.replace('telefono-ia', 'soporte-ia')
            
            print(f"🌍 Pre-Fetching Init from n8n [{dept}]: {webhook_url}")
            safe_call_id = self.channel_id.replace('.', '_')
            payload = {
                'call_id': safe_call_id, 'caller': self.caller_number, 'text': '__INIT__',
                'context': [], 'metadata': self.context_data, 'is_initial': True, 'department': dept
            }
            response = requests.post(webhook_url, json=payload, timeout=10)
            if response.status_code == 200:
                resp_json = response.json()
                return resp_json.get('response', resp_json.get('text', 'Hola'))
        except Exception as e: print(f"❌ Init Fetch Error: {e}")
        return "Hola, bienvenido."

    def close(self):
        if self.inactivity_timer: self.inactivity_timer.cancel()
        if self.rtp_receiver: self.rtp_receiver.stop()
        # ⚠️ NO eliminamos manualmente el ExternalMedia channel
        # Asterisk lo gestiona automáticamente al terminar el canal principal
        # if self.external_media_channel_id:
        #     try: requests.delete(f"{self.bot.base_url}/channels/{self.external_media_channel_id}", auth=self.bot.auth)
        #     except: pass

class ARIBot:
    def __init__(self):
        self.base_url = f"{ARI_URL}/ari"
        self.auth = (ARI_USER, ARI_PASS)
        self.sessions: Dict[str, CallSession] = {}
        os.makedirs(AUDIO_DIR, exist_ok=True)
        
    def start(self):
        print(f"📡 Connecting to ARI: {ARI_URL}")
        ws_url = f"{ARI_URL.replace('http://', 'ws://').replace('https://', 'wss://')}/ari/events?app={APP_NAME}&subscribeAll=true"
        auth_b64 = base64.b64encode(f"{ARI_USER}:{ARI_PASS}".encode('ascii')).decode('ascii')
        ws = websocket.WebSocketApp(ws_url, on_message=self.on_message, on_error=self.on_error, on_close=self.on_close, on_open=self.on_open, header=[f"Authorization: Basic {auth_b64}"])
        ws.run_forever()

    def on_open(self, ws): print("✅ WebSocket Open.")

    def on_message(self, ws, message):
        try:
            event = json.loads(message)
            etype = event.get('type')
            if etype == 'StasisStart': self.handle_stasis_start(event)
            elif etype == 'StasisEnd': self.handle_stasis_end(event)
            elif etype == 'PlaybackFinished': self.handle_playback_finished(event)
            elif etype == 'ChannelDtmfReceived': self.handle_dtmf_event(event)
        except Exception as e: print(f"⚠️ Event Error: {e}")

    def handle_dtmf_event(self, event):
        cid = event['channel']['id']
        digit = event['digit']
        if cid in self.sessions:
            self.sessions[cid].handle_dtmf(digit)

    def on_error(self, ws, error): print(f"❌ WS Error: {error}")
    def on_close(self, ws, code, msg): print("🔌 WS Closed")

    def handle_stasis_start(self, event):
        channel = event['channel']
        cid = channel['id']
        chan_name = channel.get('name', '')
        caller = channel.get('caller', {}).get('number', 'Unknown')
        
        if any(x in chan_name for x in ['ExternalMedia', 'UnicastRTP', 'Snoop']): return
        if cid in self.sessions: return

        print(f"📞 CALL START: {caller} (ID: {cid})")
        
        args = event.get('args', [])
        context_data = {k.strip(): v.strip() for arg in args if '=' in arg for k, v in [arg.split('=', 1)]}
        
        # Inicializar sesión localmente (sin contestar aún)
        session = CallSession(cid, caller, self, context_data)
        self.sessions[cid] = session
        
        # Iniciar secuencia de llamada en hilo separado (Parallel Setup)
        threading.Thread(target=self.setup_call_sequence, args=(session, context_data)).start()

    def setup_call_sequence(self, session, context_data):
        """Genera saludo ANTES de contestar, luego contesta y reproduce"""
        try:
            print(f"🚀 Starting Pre-Answer Sequence for {session.channel_id}")
            dept = context_data.get('dept', 'recepcion')
            
            # 1. Obtener Texto y Generar Audio (Mientras timbra)
            greeting_path = None
            if dept == 'ventas':
                text = session.get_n8n_init_text()
                # Guardar en contexto para que no se pierda
                session.conversation_context.append({'role': 'assistant', 'content': text})
                greeting_path = session.generate_audio_file(text)
            else:
                # Laura Local
                hour = datetime.now().hour
                if 5 <= hour < 12: greeting = "Buenos días"
                elif 12 <= hour < 19: greeting = "Buenas tardes"
                else: greeting = "Buenas noches"
                text = f"{greeting}, bienvenido a Cloudfly. Soy Laura, tu recepcionista virtual. ¿En qué puedo ayudarte hoy?"
                session.conversation_context.append({'role': 'assistant', 'content': text})
                greeting_path = session.generate_audio_file(text)
                
            # 2. Setup Media (Sigue timbrando)
            session.setup_media_server()
            
            # 3. ANSWER Call (Ahora sí cobramos/conectamos)
            requests.post(f"{self.base_url}/channels/{session.channel_id}/answer", auth=self.auth)
            
            # 4. Breve pausa para estabilizar audio
            time.sleep(0.5) 
            
            # 5. Reproducir saludo precargado
            if greeting_path:
                print(f"▶️ Playing Pre-Generated Greeting: {greeting_path}")
                session.play_existing_file(greeting_path)
                session.reset_inactivity_timer() # REINICIAR TIMER AQUI!
                
        except Exception as e:
            print(f"❌ Setup Sequence Error: {e}")
            # Fallback: answer anyway
            requests.post(f"{self.base_url}/channels/{session.channel_id}/answer", auth=self.auth)

    def handle_stasis_end(self, event):
        cid = event['channel']['id']
        if cid in self.sessions:
            self.sessions[cid].close()
            del self.sessions[cid]

    def handle_playback_finished(self, event):
        uri = event['playback']['target_uri']
        cid = uri.split('/')[-1]
        if cid in self.sessions: self.sessions[cid].is_playing = False

    def play_audio(self, channel_id, path):
        try:
            res = requests.post(f"{self.base_url}/channels/{channel_id}/play", auth=self.auth, params={'media': f'sound:{path}'})
            return res.json().get('id')
        except: return None

    def stop_playback(self, playback_id):
        try: requests.delete(f"{self.base_url}/playbacks/{playback_id}", auth=self.auth)
        except: pass

if __name__ == '__main__':
    time.sleep(2)
    bot = ARIBot()
    while True:
        try: bot.start()
        except: time.sleep(5)
