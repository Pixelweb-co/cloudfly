    def send_whatsapp_notification(
        self,
        tenant_id: int,
        company_id: int,
        phones: List[str],
        body: str,
    ) -> None:
        """Publish a WhatsApp notification payload to the dedicated topic.

        Parameters
        ----------
        tenant_id: int
            The tenant that owns the contact.
        company_id: int
            The company instance (always 1 for the WhatsApp instance).
        phones: List[str]
            Phone numbers that should receive the message.
        body: str
            The WhatsApp message body.
        """
        payload = {
            "phones": phones,
            "body": body,
            "tenantId": tenant_id,
            "companyId": company_id,
            "notifyVia": "whatsapp",
            "type": "whatsapp",
        }
        key = f"whatsapp:{tenant_id}:{company_id}:{':'.join(phones)}"
        self._produce("whatsapp-notifications", key, payload)
