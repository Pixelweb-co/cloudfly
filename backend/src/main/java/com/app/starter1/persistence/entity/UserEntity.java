package com.app.starter1.persistence.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

@Setter
@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "users")
public class UserEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @Column(nullable = false)
    private String nombres;

    @Column(nullable = false)
    private String apellidos;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "is_enabled", nullable = false)
    private boolean isEnabled;

    @Column(name = "account_no_expired", nullable = false)
    private boolean accountNoExpired;

    @Column(name = "account_no_locked", nullable = false)
    private boolean accountNoLocked;

    @Column(name = "credential_no_expired", nullable = false)
    private boolean credentialNoExpired;

    @ManyToMany(fetch = FetchType.EAGER, cascade = CascadeType.MERGE)
    @JoinTable(name = "user_roles",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id"))
    private Set<RoleEntity> roles = new HashSet<>();

    @Column(name = "verification_token")
    private String verificationToken;

    @Column(name = "recovery_token",nullable = true)
    private String recoveryToken;

    // Relación N:1 con Customer
    @ManyToOne(fetch = FetchType.EAGER) // Cambiar a EAGER si necesitas la información siempre
    @JoinColumn(name = "customer_id", nullable = true)
    private Customer customer;
}
