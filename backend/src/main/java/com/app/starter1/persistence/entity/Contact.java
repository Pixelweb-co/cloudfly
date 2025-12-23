package com.app.starter1.persistence.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "contacts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Contact {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String email;

    private String phone;

    private String address;

    private String taxId; // RUC, DNI, etc.

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ContactType type;

    // Stage for Kanban board: LEAD, POTENTIAL, CLIENT
    @Column(length = 50)
    private String stage = "LEAD";

    // Avatar/profile picture URL
    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    @Column(name = "tenant_id", nullable = false)
    private Integer tenantId;

    // ===== CAMPOS CONTABLES (Integración con Contabilidad) =====

    // Tipo de documento: CC, NIT, CE, PASAPORTE
    @Column(name = "document_type", length = 20)
    private String documentType;

    // Número de documento (sin dígito de verificación)
    @Column(name = "document_number", length = 20)
    private String documentNumber;

    // Dígito de verificación (solo para NIT)
    @Column(name = "verification_digit", length = 1)
    private String verificationDigit;

    // Razón social (para empresas)
    @Column(name = "business_name", length = 255)
    private String businessName;

    // Nombre comercial
    @Column(name = "trade_name", length = 255)
    private String tradeName;

    // Primer nombre (para personas naturales)
    @Column(name = "first_name", length = 100)
    private String firstName;

    // Apellido (para personas naturales)
    @Column(name = "last_name", length = 100)
    private String lastName;

    // Móvil/celular
    @Column(name = "mobile", length = 20)
    private String mobile;

    // Ciudad
    @Column(name = "city", length = 100)
    private String city;

    // Departamento (Colombia)
    @Column(name = "department", length = 100)
    private String department;

    // País
    @Column(name = "country", length = 50)
    private String country = "Colombia";

    // Régimen tributario: SIMPLIFICADO, COMÚN, GRAN_CONTRIBUYENTE
    @Column(name = "tax_regime", length = 50)
    private String taxRegime;

    // Es responsable de IVA
    @Column(name = "is_tax_responsible")
    private Boolean isTaxResponsible = false;

    // Es agente de retención
    @Column(name = "is_withholding_agent")
    private Boolean isWithholdingAgent = false;

    // Aplica retención en la fuente
    @Column(name = "apply_withholding_tax")
    private Boolean applyWithholdingTax = false;

    // Aplica retención de IVA
    @Column(name = "apply_vat_withholding")
    private Boolean applyVatWithholding = false;

    // Aplica retención de ICA
    @Column(name = "apply_ica_withholding")
    private Boolean applyIcaWithholding = false;

    // Porcentaje de retención personalizado (si aplica)
    @Column(name = "custom_withholding_rate")
    private Double customWithholdingRate;

    // Cuenta contable por defecto (para movimientos automáticos)
    @Column(name = "default_account_code", length = 10)
    private String defaultAccountCode;

    // Plazo de pago (días)
    @Column(name = "payment_terms_days")
    private Integer paymentTermsDays = 0;

    // Límite de crédito
    @Column(name = "credit_limit")
    private Double creditLimit = 0.0;

    // Saldo actual (deuda)
    @Column(name = "current_balance")
    private Double currentBalance = 0.0;

    // Es activo/inactivo
    @Column(name = "is_active")
    private Boolean isActive = true;

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
}
