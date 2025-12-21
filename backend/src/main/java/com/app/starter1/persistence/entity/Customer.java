package com.app.starter1.persistence.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

@Setter
@Getter
@Builder
@Table(name = "clientes")
@AllArgsConstructor
@NoArgsConstructor
@Entity
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nombre_cliente", nullable = false)
    private String name;

    @Column(name = "identificacion_cliente", unique = false, nullable = true)
    private String nit;

    @Column(name = "telefono_cliente", nullable = true) // Hacerlo opcional
    private String phone;

    @Column(name = "email_cliente", nullable = true) // Hacerlo opcional
    private String email;

    @Column(name = "direccion_cliente", nullable = true) // Hacerlo opcional
    private String address;

    @Column(name = "contacto_cliente", nullable = true) // Hacerlo opcional
    private String contact;

    @Column(name = "cargo_cliente", nullable = true) // Hacerlo opcional
    private String position;

    @Column(name = "tipo_entidad", nullable = true) // Hacerlo opcional
    private String type;

    @Column(name = "status_cliente", nullable = true)
    private Boolean status;

    @Column(name = "logo_url")
    private String logoUrl;

    @Column(name = "date_added", nullable = true)
    private LocalDate dateRegister;

    // === TIPO DE NEGOCIO Y DESCRIPCIÓN ===

    /**
     * Tipo de negocio del cliente
     * Determina el modelo de operación: VENTAS, AGENDAMIENTO, SUSCRIPCION, MIXTO
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "business_type", length = 30)
    private BusinessType businessType;

    /**
     * Descripción detallada del negocio / objeto social
     */
    @Column(name = "business_description", columnDefinition = "TEXT")
    private String businessDescription;

    @PrePersist
    public void prePersist() {
        if (this.dateRegister == null) {
            this.dateRegister = LocalDate.now();
        }
    }

    // Enum para tipo de negocio
    public enum BusinessType {
        VENTAS, // Venta de productos físicos o digitales
        AGENDAMIENTO, // Servicios con citas o reservas
        SUSCRIPCION, // Modelo de suscripción recurrente
        MIXTO // Combinación de varios tipos
    }
}
