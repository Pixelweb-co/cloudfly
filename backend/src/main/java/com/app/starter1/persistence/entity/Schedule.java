package com.app.starter1.persistence.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDate;

import lombok.*;

@Entity
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "schedule")
@Getter
@Setter

public class Schedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)  // Cambiar a LAZY para evitar problemas de rendimiento
    @JoinColumn(name = "device", nullable = false)
    @JsonIgnoreProperties({"productType", "productClass",
            "classification", "status", "dateAdded", "invimaRegister", "origin", "voltage", "power",
            "frequency", "amperage", "purchaseDate", "bookValue", "supplier", "warranty",
            "warrantyStartDate", "warrantyEndDate", "manual", "periodicity", "location", "placement",
            "contrato", "schedules"})  // Ignorar estos campos en la respuesta JSON
    private Product device;

    @Column(nullable = true)
    private String date;  // Cambiar a LocalDate para manejar correctamente las fechas

    @Enumerated(EnumType.STRING)
    @Column(nullable = true)
    private Status status;  // Usar un Enum para un status más claro

    // Enum para el campo status (si lo consideras útil)
    public enum Status {
        ACTIVE, INACTIVE;
    }
}
