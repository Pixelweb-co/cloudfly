package com.app.persistence.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.LocalDateTime;

@Table("global_agents")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GlobalAgent {

    @Id
    private Long id;

    private String name; // Ventas, Soporte, Agendamiento
    private String code; // VENTAS, SOPORTE, AGENDAMIENTO

    @Column("base_prompt")
    private String basePrompt;

    private Boolean isActive;

    @CreatedDate
    @Column("created_at")
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column("updated_at")
    private LocalDateTime updatedAt;
}
