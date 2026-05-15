package com.app.persistence.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("payment_methods")
public class PaymentMethodEntity {

    @Id
    private Long id;

    @Column("tenant_id")
    private Long tenantId;

    private String provider;

    @Column("payment_source_id")
    private String paymentSourceId;

    private String token;

    private String brand;

    private String last4;

    @Column("exp_month")
    private Integer expMonth;

    @Column("exp_year")
    private Integer expYear;

    @Column("is_default")
    private Boolean isDefault;

    @Column("created_at")
    private LocalDateTime createdAt;

    @Column("updated_at")
    private LocalDateTime updatedAt;
}
