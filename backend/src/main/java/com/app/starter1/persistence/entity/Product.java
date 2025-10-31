package com.app.starter1.persistence.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "products")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Product {

    @Id
    @Column(name = "id_producto")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tipo_producto")
    private Long productType;

    @Column(name = "codigo_producto")
    private String productCode;

    @Column(name = "nombre_producto")
    private String productName;

    @Column(name = "marca_producto")
    private String brand;

    @Column(name = "modelo_producto")
    private String model;

    @Column(name = "placa_producto")
    private String licensePlate;

    @Column(name = "clase_producto")
    private String productClass;

    @Column(name = "clasificacion_producto")
    private String classification;

    @Column(name = "status_producto")
    private String status;

    @Column(name = "date_added", nullable = true, updatable = false)
    private LocalDate dateAdded;

    @PrePersist
    public void prePersist() {
        if (this.dateAdded == null) {
            this.dateAdded = LocalDate.now();
        }
    }

    @Column(name = "reginv_producto")
    private String invimaRegister;

    @Column(name = "procedencia_producto")
    private String origin;

    @Column(name = "voltaje_producto")
    private String voltage;

    @Column(name = "potencia_producto")
    private String power;

    @Column(name = "frecuencia_producto")
    private String frequency;

    @Column(name = "amperios_producto")
    private String amperage;

    @Column(name = "fecha_compra_producto")
    private LocalDate purchaseDate;

    @Column(name = "valor_contable_producto")
    private Integer bookValue;

    @Column(name = "proveedor_producto")
    private String supplier;

    @Column(name = "cliente_producto")
    private Long customer;

    @Column(name = "garantia_producto")
    private String warranty;

    @Column(name = "inicio_garantia_producto")
    private LocalDate warrantyStartDate;

    @Column(name = "fin_garantia_producto")
    private LocalDate warrantyEndDate;

    @Column(name = "manual_producto")
    private String manual;

    @Column(name = "periocidad")
    private String periodicity;

    @Column(name = "sede_producto")
    private String location;

    @Column(name = "ubicacion_producto")
    private String placement;

    @Column(name = "verification")
    private Boolean verification;

    @OneToOne(targetEntity = Image.class,cascade = CascadeType.ALL,fetch = FetchType.EAGER)
    private Image image;

//    @Column(name = "id_contrato")
//
    @ManyToOne(fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @JoinColumn(name = "contrato")
    @JsonIgnore
    private Contrato contrato;

    @OneToMany(mappedBy = "device", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    private List<Schedule> schedules;

}
