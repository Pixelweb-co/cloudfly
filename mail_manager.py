import subprocess
import time
import re
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class MailManager:
    def __init__(self, host="cloudfly.com.co", port=10622, user="root", key_path=None):
        self.host = host
        self.port = port
        self.user = user
        self.key_path = key_path
        self.ssh_base = f'ssh -o PasswordAuthentication=no -p {self.port} -i "{self.key_path}" {self.user}@{self.host}'

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
        # Intentar con usuario 'cloudfly' que es el dueño del dominio
        cmd = f"/usr/local/hestia/bin/v-add-mail-account cloudfly {domain} {account} '{password}'"
        res = self.run_ssh_command(cmd)
        return res is not None

    def delete_mail_account(self, domain, account):
        logger.info(f"Eliminando cuenta de correo: {account}@{domain}")
        cmd = f"/usr/local/hestia/bin/v-delete-mail-account cloudfly {domain} {account}"
        self.run_ssh_command(cmd)

    def get_latest_email_content(self, domain, account):
        logger.info(f"Buscando último correo para: {account}@{domain}")
        # Hestia guarda correos en /home/{user}/mail/{domain}/{account}/new/
        mail_path = f"/home/cloudfly/mail/{domain}/{account}/new/"
        
        # Listar archivos ordenados por tiempo
        cmd_list = f"ls -t {mail_path} | head -n 1"
        filename = self.run_ssh_command(cmd_list)
        
        if not filename or "No such file" in filename:
            logger.warning("No se encontraron correos nuevos.")
            return None
        
        full_path = f"{mail_path}{filename}"
        content = self.run_ssh_command(f"cat {full_path}")
        return content

    def wait_for_activation_link(self, domain, account, timeout=60):
        start_time = time.time()
        logger.info(f"Esperando email de activación para {account}@{domain} (timeout {timeout}s)...")
        
        while time.time() - start_time < timeout:
            content = self.get_latest_email_content(domain, account)
            if content:
                # Buscar el enlace de activación en el contenido del correo
                # Basado en la plantilla: <a href="${activateLink}" ...
                # El enlace suele ser algo como https://dashboard.cloudfly.com.co/verify-email?token=...
                links = re.findall(r'https?://[^\s<>"]+/verify-email\?token=[^\s<>"]+', content)
                if links:
                    logger.info(f"Enlace de activación encontrado: {links[0]}")
                    return links[0]
                
                # También buscar por el token plano si el link viene codificado
                tokens = re.findall(r'token=([a-zA-Z0-9\-\._~]+)', content)
                if tokens:
                    logger.info(f"Token de activación extraído: {tokens[0]}")
                    return f"https://dashboard.cloudfly.com.co/verify-email?token={tokens[0]}"

            time.sleep(5)
        
        logger.error("Se agotó el tiempo de espera para el correo de activación.")
        return None

# Ejemplo de uso/test
if __name__ == "__main__":
    import os
    key = os.path.expanduser("~/.ssh/id_rsa_cloudfly")
    mm = MailManager(key_path=key)
    
    test_acc = "test_e2e_" + str(int(time.time()))
    domain = "cloudfly.com.co"
    
    if mm.create_mail_account(domain, test_acc, "Password123*"):
        print(f"Cuenta {test_acc}@{domain} lista.")
        # Link = mm.wait_for_activation_link(domain, test_acc, timeout=30)
        # mm.delete_mail_account(domain, test_acc)
