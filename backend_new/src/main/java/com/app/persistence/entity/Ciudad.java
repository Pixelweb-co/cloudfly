package com.app.persistence.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Table;
import org.springframework.data.relational.core.mapping.Column;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("ciudades")
public class Ciudad {
    @Id
    private Long id;

    @Column("cod_dane")
    private String codDane;

    private String nombre;

    @Column("departamento_cod")
    private String departamentoCod;
    
    private Boolean estado;

    @Column("created_at")
    private LocalDateTime createdAt;

    @Column("updated_at")
    private LocalDateTime updatedAt;
}
