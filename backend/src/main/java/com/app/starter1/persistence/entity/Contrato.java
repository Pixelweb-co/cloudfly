package com.app.starter1.persistence.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "contratacion")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Contrato {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;


    @Column(name = "fecha_inicio", nullable = true)
    private LocalDate fechaInicio;

    @Column(name = "fecha_final", nullable = true)
    private LocalDate fechaFinal;

    @Column(name = "numero", nullable = true)
    private String numero;


    @Column(name = "descripcion", nullable = true)
    private String descripcionContrato;

    @Column(name = "estado", nullable = false)
    private String estado;

    @OneToOne
    @JoinColumn(name = "customer_id")
    @JsonBackReference
    private Customer cliente;


    // Relación ManyToMany con Producto usando la tabla intermedia "productos_contrato"
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "productos_contrato",  // Nombre de la tabla intermedia
            joinColumns = @JoinColumn(name = "id_contrato"),  // Columna que hace referencia al contrato
            inverseJoinColumns = @JoinColumn(name = "id_producto")  // Columna que hace referencia al producto
    )
    private Set<Product> productos = new HashSet<>();

}
