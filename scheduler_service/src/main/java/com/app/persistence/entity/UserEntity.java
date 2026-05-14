package com.app.persistence.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("users")
public class UserEntity {
    @Id
    private Long id;

    private String nombres;
    private String apellidos;

    @Column("contact_id")
    private Long contactId;

    @Column("company_id")
    private Long companyId;

    @Column("is_enabled")
    private Boolean isEnabled;
}
