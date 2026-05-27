package com.app.persistence.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("media")
public class Media {

    @Id
    private Long id;

    @Column("tenant_id")
    private Long tenantId;

    @Column("filename")
    private String filename;

    @Column("original_name")
    private String originalName;

    @Column("content_type")
    private String contentType;

    @Column("size")
    private Long size;

    @Column("url")
    private String url;

    @Column("created_at")
    private LocalDateTime createdAt;
}
