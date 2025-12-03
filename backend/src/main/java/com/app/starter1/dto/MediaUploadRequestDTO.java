package com.app.starter1.dto;

public class MediaUploadRequestDTO {

    private Long tenantId;  // obligatorio

    // si después quieres categorizar, puedes agregar más campos (tag, carpeta lógica, etc.)
    private String tag;

    public Long getTenantId() { return tenantId; }
    public void setTenantId(Long tenantId) { this.tenantId = tenantId; }

    public String getTag() { return tag; }
    public void setTag(String tag) { this.tag = tag; }
}
