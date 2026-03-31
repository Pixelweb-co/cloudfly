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

    // Explicit getters/setters to bypass Lombok issues on VPS
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getNombres() { return nombres; }
    public void setNombres(String nombres) { this.nombres = nombres; }
    public String getApellidos() { return apellidos; }
    public void setApellidos(String apellidos) { this.apellidos = apellidos; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public boolean isEnabled() { return isEnabled; }
    public void setEnabled(boolean enabled) { isEnabled = enabled; }
    public boolean isAccountNoExpired() { return accountNoExpired; }
    public void setAccountNoExpired(boolean accountNoExpired) { this.accountNoExpired = accountNoExpired; }
    public boolean isAccountNoLocked() { return accountNoLocked; }
    public void setAccountNoLocked(boolean accountNoLocked) { this.accountNoLocked = accountNoLocked; }
    public boolean isCredentialNoExpired() { return credentialNoExpired; }
    public void setCredentialNoExpired(boolean credentialNoExpired) { this.credentialNoExpired = credentialNoExpired; }
    public String getVerificationToken() { return verificationToken; }
    public void setVerificationToken(String verificationToken) { this.verificationToken = verificationToken; }
    public String getRecoveryToken() { return recoveryToken; }
    public void setRecoveryToken(String recoveryToken) { this.recoveryToken = recoveryToken; }
    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }
}
