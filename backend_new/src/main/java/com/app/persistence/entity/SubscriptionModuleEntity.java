package com.app.persistence.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("subscription_modules")
public class SubscriptionModuleEntity {

    @Column("subscription_id")
    private Long subscriptionId;

    @Column("module_id")
    private Long moduleId;
}
