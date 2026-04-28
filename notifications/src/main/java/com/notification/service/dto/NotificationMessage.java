package com.notification.service.dto;

import java.util.Map;

/**
 * DTO para mensajes de notificación con soporte para adjuntos
 */
@com.fasterxml.jackson.annotation.JsonIgnoreProperties(ignoreUnknown = true)
public class NotificationMessage {
    private String to;
    private String subject;
    private String body;
    private String type;
    private String username;
    private Long tenantId;
    private Long companyId;

    // Campos para adjuntos PDF
    private String pdfAttachment; // PDF en Base64
    private String pdfFileName; // Nombre del archivo PDF

    // Datos para plantilla FreeMarker
    private Map<String, Object> templateData;

    // Getters y setters
    public String getTo() {
        return to;
    }

    @com.fasterxml.jackson.annotation.JsonSetter("to")
    public void setTo(Object to) {
        if (to instanceof java.util.List) {
            java.util.List<?> list = (java.util.List<?>) to;
            this.to = String.join(",", list.stream().map(Object::toString).toList());
        } else {
            this.to = to != null ? to.toString() : null;
        }
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public String getBody() {
        return body;
    }

    public void setBody(String body) {
        this.body = body;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getUsername() {
        return username;
    }

    public String getPdfAttachment() {
        return pdfAttachment;
    }

    public void setPdfAttachment(String pdfAttachment) {
        this.pdfAttachment = pdfAttachment;
    }

    public String getPdfFileName() {
        return pdfFileName;
    }

    public void setPdfFileName(String pdfFileName) {
        this.pdfFileName = pdfFileName;
    }

    public Map<String, Object> getTemplateData() {
        return templateData;
    }

    public void setTemplateData(Map<String, Object> templateData) {
        this.templateData = templateData;
    }

    public Long getTenantId() {
        return tenantId;
    }

    public void setTenantId(Long tenantId) {
        this.tenantId = tenantId;
    }

    public Long getCompanyId() {
        return companyId;
    }

    public void setCompanyId(Long companyId) {
        this.companyId = companyId;
    }

    /**
     * Verifica si el mensaje tiene un PDF adjunto
     */
    public boolean hasPdfAttachment() {
        return pdfAttachment != null && !pdfAttachment.isBlank()
                && pdfFileName != null && !pdfFileName.isBlank();
    }
}
