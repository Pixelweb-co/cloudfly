from .whatsapp_client import WhatsAppClient
from .db import get_connection   # assumed helper
from datetime import datetime
import logging

log = logging.getLogger(__name__)

def send_whatsapp_transfer_notification(transfer_id: str) -> bool:
    """
    Retrieve transfer data, build the WhatsApp message and send it.
    Returns True on success, False on any error.
    """
    try:
        # 1️⃣ Fetch transfer + user data
        sql = """
            SELECT t.id, t.description, t.created_at,
                   u_origin.name AS origin_name, u_origin.whatsapp_number AS origin_whatsapp,
                   u_dest.name   AS dest_name,   u_dest.whatsapp_number   AS dest_whatsapp,
                   a.id AS admin_id, a.whatsapp_number AS admin_whatsapp
            FROM transfers t
            JOIN users u_origin ON t.origin_user_id = u_origin.id
            JOIN users u_dest   ON t.dest_user_id   = u_dest.id
            LEFT JOIN admins a   ON t.tenant_id = a.tenant_id
            WHERE t.id = %s;
        """
        with get_connection() as conn:
            cur = conn.cursor()
            cur.execute(sql, (transfer_id,))
            row = cur.fetchone()
            if not row:
                log.error("Transfer %s not found", transfer_id)
                return False

        # 2️⃣ Build message
        dashboard_url = f"https://app.cloudfly.com/transfer/{transfer_id}"
        message = (
            f"Transferencia Humana #{row['id']}\n"
            f"De: {row['origin_name']}\n"
            f"Para: {row['dest_name']}\n"
            f"Fecha: {row['created_at'].strftime('%Y-%m-%d %H:%M')}\n"
            f"Detalle: {row['description']}\n"
            f"Ver: {dashboard_url}"
        )

        # 3️⃣ Send to Advisor (dest) and optionally Admin
        client = WhatsAppClient()
        success = client.send_message(row['dest_whatsapp'], message)
        if row.get('admin_whatsapp'):
            success = client.send_message(row['admin_whatsapp'], message) and success
        return success
    except Exception as exc:
        log.exception("Failed to send WhatsApp transfer notification: %s", exc)
        return False
