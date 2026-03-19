package com.app.persistence.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.relational.core.mapping.Table;
import org.springframework.data.relational.core.mapping.Column;

import java.time.LocalDateTime;

@Table("channel_type_configs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChannelTypeConfig {

    @Id
    private Long id;

    @Column("type_name")
    private String typeName;

    private String description;

    @Column("webhook_url")
    private String webhookUrl;

    private Boolean status;

    @CreatedDate
    @Column("created_at")
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column("updated_at")
    private LocalDateTime updatedAt;
}
