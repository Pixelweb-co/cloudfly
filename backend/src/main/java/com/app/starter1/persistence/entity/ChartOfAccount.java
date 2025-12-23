package com.app.starter1.persistence.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "chart_of_accounts")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChartOfAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 10)
    private String code;

    @Column(nullable = false)
    private String name;

    @Column(name = "account_type", length = 50)
    private String accountType; // ACTIVO, PASIVO, PATRIMONIO, INGRESO, GASTO, COSTO

    @Column(name = "level")
    private Integer level; // 1=Clase, 2=Grupo, 3=Cuenta, 4=Subcuenta

    @Column(name = "parent_code", length = 10)
    private String parentCode;

    @Column(length = 10)
    private String nature; // DEBITO, CREDITO

    @Column(name = "requires_third_party")
    private Boolean requiresThirdParty = false;

    @Column(name = "requires_cost_center")
    private Boolean requiresCostCenter = false;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "is_system")
    private Boolean isSystem = false;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
