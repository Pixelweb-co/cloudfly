package com.app.starter1.persistence.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Entidad que representa una cuenta del Plan Único de Cuentas (PUC) de Colombia
 */
@Entity
@Table(name = "chart_of_accounts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChartOfAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Código de la cuenta según PUC
     * Ejemplos: "1", "11", "1105", "110505"
     */
    @Column(nullable = false, unique = true, length = 10)
    private String code;

    /**
     * Nombre de la cuenta
     * Ejemplo: "Caja", "Bancos", "Clientes"
     */
    @Column(nullable = false)
    private String name;

    /**
     * Tipo de cuenta según clasificación contable
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "account_type", length = 50)
    private AccountType accountType;

    /**
     * Nivel de la cuenta en la jerarquía
     * 1 = Clase, 2 = Grupo, 3 = Cuenta, 4 = Subcuenta
     */
    @Column(nullable = false)
    private Integer level;

    /**
     * Código de la cuenta padre (para jerarquía)
     */
    @Column(name = "parent_code", length = 10)
    private String parentCode;

    /**
     * Naturaleza de la cuenta (DEBITO o CREDITO)
     */
    @Enumerated(EnumType.STRING)
    @Column(length = 10)
    private AccountNature nature;

    /**
     * Indica si la cuenta requiere un tercero asociado
     * Ejemplo: Cuentas de clientes o proveedores
     */
    @Column(name = "requires_third_party")
    private Boolean requiresThirdParty = false;

    /**
     * Indica si la cuenta requiere un centro de costo
     */
    @Column(name = "requires_cost_center")
    private Boolean requiresCostCenter = false;

    /**
     * Indica si la cuenta está activa
     */
    @Column(name = "is_active")
    private Boolean isActive = true;

    /**
     * Indica si es una cuenta del sistema (no se puede eliminar)
     */
    @Column(name = "is_system")
    private Boolean isSystem = false;

    @Column(name = "created_at")
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

    /**
     * Verifica si la cuenta es de nivel movible (nivel 4)
     */
    public boolean isMovable() {
        return level != null && level == 4;
    }

    /**
     * Obtiene el nombre completo con código
     */
    public String getFullName() {
        return code + " - " + name;
    }

    /**
     * Tipos de cuenta según clasificación contable
     */
    public enum AccountType {
        ACTIVO,
        PASIVO,
        PATRIMONIO,
        INGRESO,
        GASTO,
        COSTO
    }

    /**
     * Naturaleza de la cuenta
     */
    public enum AccountNature {
        DEBITO, // Para activos, gastos y costos
        CREDITO // Para pasivos, patrimonio e ingresos
    }
}
