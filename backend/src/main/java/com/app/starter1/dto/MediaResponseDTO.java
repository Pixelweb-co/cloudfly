package com.app.starter1.dto;

import java.time.LocalDateTime;

public class MediaResponseDTO {

    private Long id;
    private Long tenantId;
    private String filename;
    private String originalFilename;
    private String url;          // para mostrar/usar en el front
    private Long size;
    private String contentType;
    private LocalDateTime createdAt;

    public MediaResponseDTO() {}

    public MediaResponseDTO(Long id, Long tenantId, String filename, String originalFilename,
                            String url, Long size, String contentType, LocalDateTime createdAt) {
        this.id = id;
        this.tenantId = tenantId;
        this.filename = filename;
        this.originalFilename = originalFilename;
        this.url = url;
        this.size = size;
        this.contentType = contentType;
        this.createdAt = createdAt;
    }

    // getters & setters

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getTenantId() { return tenantId; }
    public void setTenantId(Long tenantId) { this.tenantId = tenantId; }

    public String getFilename() { return filename; }
    public void setFilename(String filename) { this.filename = filename; }

    public String getOriginalFilename() { return originalFilename; }
    public void setOriginalFilename(String originalFilename) { this.originalFilename = originalFilename; }

    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }

    public Long getSize() { return size; }
    public void setSize(Long size) { this.size = size; }

    public String getContentType() { return contentType; }
    public void setContentType(String contentType) { this.contentType = contentType; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
