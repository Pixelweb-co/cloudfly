package com.app.persistence.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Table("users")
public class UserEntity {

    @Id
    private Long id;

    private String nombres;
    private String apellidos;

    @Column("username")
    private String username;

    private String password;
    private String email;

    @Column("is_enabled")
    private boolean isEnabled;

    @Column("account_no_expired")
    private boolean accountNoExpired;

    @Column("account_no_locked")
    private boolean accountNoLocked;

    @Column("credential_no_expired")
    private boolean credentialNoExpired;

    @Column("verification_token")
    private String verificationToken;

    @Column("recovery_token")
    private String recoveryToken;

    @Column("customer_id")
    private Long customerId;
}
