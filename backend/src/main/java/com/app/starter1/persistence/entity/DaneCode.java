package com.app.starter1.persistence.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Entidad para códigos DANE de Colombia (Departamentos y Ciudades)
 * Usado para facturación electrónica DIAN
 */
@Setter
@Getter
@Builder
@Table(name = "dane_codes", indexes = {
        @Index(name = "idx_dane_tipo", columnList = "tipo"),
        @Index(name = "idx_dane_codigo", columnList = "codigo"),
        @Index(name = "idx_dane_depto", columnList = "codigo_departamento")
})
@AllArgsConstructor
@NoArgsConstructor
@Entity
public class DaneCode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Tipo de código: DEPARTAMENTO o CIUDAD
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", nullable = false, length = 15)
    private TipoDane tipo;

    /**
     * Código DANE
     * - Para departamentos: 2 dígitos (ej: "05" para Antioquia)
     * - Para ciudades: 5 dígitos (ej: "05001" para Medellín)
     */
    @Column(name = "codigo", nullable = false, unique = true, length = 5)
    private String codigo;

    /**
     * Nombre del departamento o ciudad
     */
    @Column(name = "nombre", nullable = false, length = 150)
    private String nombre;

    /**
     * Código del departamento al que pertenece (solo para ciudades)
     * NULL para departamentos
     */
    @Column(name = "codigo_departamento", length = 2)
    private String codigoDepartamento;

    /**
     * Indica si el código está activo
     */
    @Column(name = "activo", nullable = false)
    @Builder.Default
    private Boolean activo = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /**
     * Enum para tipo de código DANE
     */
    public enum TipoDane {
        DEPARTAMENTO,
        CIUDAD
    }

    @PrePersist
    public void prePersist() {
        if (tipo == TipoDane.DEPARTAMENTO && codigo != null && codigo.length() > 2) {
            // Truncar a 2 dígitos para departamentos
            codigo = codigo.substring(0, 2);
        }
    }
}
