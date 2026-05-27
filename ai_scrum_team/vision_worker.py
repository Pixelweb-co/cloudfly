import os
import sys
import time
import base64
import requests
import threading

# Force UTF-8 encoding for Windows terminal
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

class VisionWorker:
    def __init__(self, env_path=None):
        self.api_key = os.getenv("OPENROUTER_API_KEY")
        self.jira_url = os.getenv("JIRA_API_URL")
        self.jira_email = os.getenv("JIRA_EMAIL")
        self.jira_token = os.getenv("JIRA_API_TOKEN")

    def encode_image_base64(self, image_path):
        """Converts an image file to base64 string."""
        with open(image_path, "rb") as image_file:
            return base64.b64encode(image_file.read()).decode('utf-8')

    def analyze_comment_image_async(self, issue_key, attachment_id, filename, content_url):
        """
        Launches a background, non-blocking thread to download and analyze the image.
        """
        thread = threading.Thread(
            target=self._download_and_analyze_job,
            args=(issue_key, attachment_id, filename, content_url),
            daemon=True
        )
        thread.start()
        print(f"👁️  [Vision Worker]: Lanzando análisis asíncrono en segundo plano para el archivo '{filename}'...")

    def _download_and_analyze_job(self, issue_key, attachment_id, filename, content_url):
        """
        Internal job running inside the background thread.
        """
        try:
            # 1. Download image from Jira safely
            tmp_dir = r"C:\apps\cloudfly\scratch"
            os.makedirs(tmp_dir, exist_ok=True)
            local_path = os.path.join(tmp_dir, f"jira_att_{attachment_id}_{filename}")
            
            headers = {}
            if self.jira_email and self.jira_token:
                # Basic Auth for Jira Cloud downloads
                import base64
                auth_str = f"{self.jira_email}:{self.jira_token}"
                encoded_auth = base64.b64encode(auth_str.encode('utf-8')).decode('utf-8')
                headers["Authorization"] = f"Basic {encoded_auth}"
                
            response = requests.get(content_url, headers=headers, timeout=30)
            if response.status_code != 200:
                print(f"❌ [Vision Worker - Error]: No se pudo descargar la imagen {filename}. HTTP {response.status_code}")
                return
                
            with open(local_path, "wb") as f:
                f.write(response.content)
                
            print(f"📥 [Vision Worker]: Imagen {filename} descargada correctamente en local ({os.path.getsize(local_path)} bytes).")
            
            # 2. Convert to Base64
            img_b64 = self.encode_image_base64(local_path)
            
            # 3. Call OpenRouter Free Vision Model (Google Gemini 2.5 Flash Free)
            url = "https://openrouter.ai/api/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "model": "google/gemini-2.5-flash:free",
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": (
                                    "Analiza detalladamente esta captura de pantalla o imagen adjunta a la tarea de Jira "
                                    f"{issue_key}. Explica qué error técnico se observa, qué elementos de la interfaz de "
                                    "usuario (UI) están involucrados, qué textos se leen y qué acciones debe tomar el desarrollador "
                                    "de software para corregir o implementar lo que se muestra visualmente de forma precisa."
                                )
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/png;base64,{img_b64}"
                                }
                            }
                        ]
                    }
                ]
            }
            
            print(f"👁️  [Vision Worker]: Enviando imagen a Gemini 2.5 Flash Free para análisis visual...")
            res = requests.post(url, json=payload, headers=headers, timeout=60)
            
            if res.status_code == 200:
                data = res.json()
                desc = data['choices'][0]['message']['content']
                
                # 4. Save analysis as a memory log so all developers in Scrum can read it in text format!
                analysis_path = r"C:\apps\cloudfly\ai_scrum_team\lessons_learned.md"
                timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
                
                entry = f"\n\n## 👁️ Análisis Visual Asíncrono ({timestamp}) - Archivo: {filename} ({issue_key})\n"
                entry += f"*   **Imagen Analizada**: Descargada desde Jira ({filename})\n"
                entry += f"*   **Reporte Visual de Gemini 2.5 Flash**:\n\n{desc}\n"
                
                with open(analysis_path, "a", encoding="utf-8") as lf:
                    lf.write(entry)
                    
                print(f"🧠 [Vision Worker - Éxito]: Análisis visual del adjunto '{filename}' guardado en la memoria del Scrum Team.")
                
                # Clean up local tmp file to save space
                try:
                    os.remove(local_path)
                except Exception:
                    pass
            else:
                print(f"❌ [Vision Worker - Error LMM]: HTTP {res.status_code} - {res.text}")
        except Exception as e:
            print(f"❌ [Vision Worker - Fallo Crítico]: {e}")
