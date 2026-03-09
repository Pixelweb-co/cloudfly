import quopri
import subprocess
import time
import re
import logging
import imaplib
import email
from email.header import decode_header

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class MailManager:
    def __init__(self, host="89.117.147.134", port=10622, user="root", key_path=None):
        self.host = host
        self.port = port
        self.user = user
        self.key_path = key_path
        self.ssh_base = f'ssh -o StrictHostKeyChecking=no -o PasswordAuthentication=no -p {self.port} -i "{self.key_path}" {self.user}@{self.host}'

    def run_ssh_command(self, command):
        full_command = f'{self.ssh_base} "{command}"'
        try:
            result = subprocess.run(full_command, shell=True, capture_output=True, text=True, timeout=30)
            if result.returncode != 0:
                logger.error(f"Error SSH ({result.returncode}): {result.stderr}")
            return result.stdout.strip()
        except Exception as e:
            logger.error(f"Excepción en comando SSH: {e}")
            return None

    def create_mail_account(self, domain, account, password):
        logger.info(f"Creando cuenta de correo: {account}@{domain}")
        cmd = f"/usr/local/hestia/bin/v-add-mail-account cloudfly {domain} {account} '{password}'"
        res = self.run_ssh_command(cmd)
        return res is not None

    def delete_mail_account(self, domain, account):
        logger.info(f"Eliminando cuenta de correo: {account}@{domain}")
        cmd = f"/usr/local/hestia/bin/v-delete-mail-account cloudfly {domain} {account}"
        self.run_ssh_command(cmd)

    def get_email_content_imap(self, domain, account, password):
        user_email = f"{account}@{domain}"
        logger.info(f"Buscando correo vía IMAP para: {user_email}")
        try:
            # Conexión IMAP SSL (puerto 993)
            mail = imaplib.IMAP4_SSL(self.host, 993)
            mail.login(user_email, password)
            mail.select("INBOX")

            # Buscar correos
            status, messages = mail.search(None, "ALL")
            if status != "OK" or not messages[0]:
                mail.logout()
                return None

            # Obtener el último ID
            msg_ids = messages[0].split()
            last_msg_id = msg_ids[-1]

            # Fetch del correo
            status, data = mail.fetch(last_msg_id, "(RFC822)")
            if status != "OK":
                mail.logout()
                return None

            raw_email = data[0][1]
            msg = email.message_from_bytes(raw_email)

            # Extraer cuerpo HTML o plano
            body = ""
            if msg.is_multipart():
                for part in msg.walk():
                    content_type = part.get_content_type()
                    if content_type in ["text/html", "text/plain"]:
                        payload = part.get_payload(decode=True)
                        if payload:
                            body += payload.decode('utf-8', errors='ignore')
            else:
                payload = msg.get_payload(decode=True)
                if payload:
                    body = payload.decode('utf-8', errors='ignore')

            mail.logout()
            return body
        except Exception as e:
            logger.error(f"Error IMAP: {e}")
            return None

    def wait_for_activation_link(self, domain, account, password, timeout=90):
        start_time = time.time()
        logger.info(f"Esperando email de activación para {account}@{domain} (timeout {timeout}s)...")
        
        while time.time() - start_time < timeout:
            content = self.get_email_content_imap(domain, account, password)
            if content:
                # Buscar enlace de activación: /verificate/{token}
                # El enlace en producción es https://dashboard.cloudfly.com.co/verificate/{token}
                links = re.findall(r'https?://[^\s<>"]+/verificate/[a-zA-Z0-9\-]+', content)
                if links:
                    logger.info(f"Enlace de activación encontrado: {links[0]}")
                    return links[0]
                
                # Búsqueda alternativa por patrón de token UUID
                tokens = re.findall(r'/verificate/([a-f0-9\-]{36})', content)
                if tokens:
                    logger.info(f"Token de activación extraído: {tokens[0]}")
                    return f"https://dashboard.cloudfly.com.co/verificate/{tokens[0]}"

            time.sleep(10)
        
        logger.error("Se agotó el tiempo de espera para el correo de activación.")
        return None

if __name__ == "__main__":
    # Test rápido si se ejecuta solo
    pass
