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

    @PrePersist
    public void prePersist() {
        if (this.dateRegister == null) {
            this.dateRegister = LocalDate.now();
        }
    }

}
