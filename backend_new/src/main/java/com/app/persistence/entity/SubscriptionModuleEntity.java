package com.app.persistence.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Transient;
import org.springframework.data.domain.Persistable;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("subscription_modules")
public class SubscriptionModuleEntity implements Persistable<Object> {

    @Column("subscription_id")
    private Long subscriptionId;

    @Column("module_id")
    private Long moduleId;

    @Transient
    @Builder.Default
    private boolean isNew = true;

    @Override
    public Object getId() {
        // Return null or a composite key representation if needed, 
        // but for pure inserts, R2DBC just needs isNew() to be true.
        return null;
    }

    @Override
    public boolean isNew() {
        return isNew;
    }
}
