package com.app.dto;

import com.app.persistence.entity.TenantEntity;
import com.app.persistence.entity.RoleEntity;
import java.util.List;

public class UserDto {
    private Long id;
    private String nombres;
    private String apellidos;
    private String username;
    private String email;
    private boolean isEnabled;
    private boolean accountNoExpired;
    private boolean accountNoLocked;
    private boolean credentialNoExpired;
    private String verificationToken;
    private String recoveryToken;
    private Long customerId;

    // Enriquecido
    private Long activeCompanyId;
    private Long tenant_id; // Alias for customerId
    private Long company_id; // Alias for activeCompanyId
    private List<RoleEntity> roles;
    private TenantEntity tenant;
    private TenantEntity customer; // Alias for tenant for frontend compatibility
    private boolean hasActiveSubscription;
    private ChannelConfigDTO channelConfig;

    public UserDto() {}
    public UserDto(Long id, String nombres, String apellidos, String username, String email, boolean isEnabled, boolean accountNoExpired, boolean accountNoLocked, boolean credentialNoExpired, String verificationToken, String recoveryToken, Long customerId, Long activeCompanyId, Long tenant_id, Long company_id, List<RoleEntity> roles, TenantEntity tenant, TenantEntity customer, boolean hasActiveSubscription, ChannelConfigDTO channelConfig) {
        this.id = id;
        this.nombres = nombres;
        this.apellidos = apellidos;
        this.username = username;
        this.email = email;
        this.isEnabled = isEnabled;
        this.accountNoExpired = accountNoExpired;
        this.accountNoLocked = accountNoLocked;
        this.credentialNoExpired = credentialNoExpired;
        this.verificationToken = verificationToken;
        this.recoveryToken = recoveryToken;
        this.customerId = customerId;
        this.activeCompanyId = activeCompanyId;
        this.tenant_id = tenant_id;
        this.company_id = company_id;
        this.roles = roles;
        this.tenant = tenant;
        this.customer = customer;
        this.hasActiveSubscription = hasActiveSubscription;
        this.channelConfig = channelConfig;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getNombres() { return nombres; }
    public void setNombres(String nombres) { this.nombres = nombres; }
    public String getApellidos() { return apellidos; }
    public void setApellidos(String apellidos) { this.apellidos = apellidos; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
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
    public Long getActiveCompanyId() { return activeCompanyId; }
    public void setActiveCompanyId(Long activeCompanyId) { this.activeCompanyId = activeCompanyId; }
    public List<RoleEntity> getRoles() { return roles; }
    public void setRoles(List<RoleEntity> roles) { this.roles = roles; }
    public TenantEntity getTenant() { return tenant; }
    public void setTenant(TenantEntity tenant) { this.tenant = tenant; }
    public boolean isHasActiveSubscription() { return hasActiveSubscription; }
    public void setHasActiveSubscription(boolean hasActiveSubscription) { this.hasActiveSubscription = hasActiveSubscription; }
    public ChannelConfigDTO getChannelConfig() { return channelConfig; }
    public void setChannelConfig(ChannelConfigDTO channelConfig) { this.channelConfig = channelConfig; }

    public Long getTenant_id() { return tenant_id; }
    public void setTenant_id(Long tenant_id) { this.tenant_id = tenant_id; }
    public Long getCompany_id() { return company_id; }
    public void setCompany_id(Long company_id) { this.company_id = company_id; }
    public TenantEntity getCustomer() { return customer; }
    public void setCustomer(TenantEntity customer) { this.customer = customer; }
    public static class UserDtoBuilder {
        private Long id;
        private String nombres;
        private String apellidos;
        private String username;
        private String email;
        private boolean isEnabled;
        private boolean accountNoExpired;
        private boolean accountNoLocked;
        private boolean credentialNoExpired;
        private String verificationToken;
        private String recoveryToken;
        private Long customerId;
        private Long activeCompanyId;
        private Long tenant_id;
        private Long company_id;
        private List<RoleEntity> roles;
        private TenantEntity tenant;
        private TenantEntity customer; // Alias
        private boolean hasActiveSubscription;
        private ChannelConfigDTO channelConfig;

        public UserDtoBuilder id(Long id) { this.id = id; return this; }
        public UserDtoBuilder nombres(String nombres) { this.nombres = nombres; return this; }
        public UserDtoBuilder apellidos(String apellidos) { this.apellidos = apellidos; return this; }
        public UserDtoBuilder username(String username) { this.username = username; return this; }
        public UserDtoBuilder email(String email) { this.email = email; return this; }
        public UserDtoBuilder isEnabled(boolean isEnabled) { this.isEnabled = isEnabled; return this; }
        public UserDtoBuilder accountNoExpired(boolean accountNoExpired) { this.accountNoExpired = accountNoExpired; return this; }
        public UserDtoBuilder accountNoLocked(boolean accountNoLocked) { this.accountNoLocked = accountNoLocked; return this; }
        public UserDtoBuilder credentialNoExpired(boolean credentialNoExpired) { this.credentialNoExpired = credentialNoExpired; return this; }
        public UserDtoBuilder verificationToken(String verificationToken) { this.verificationToken = verificationToken; return this; }
        public UserDtoBuilder recoveryToken(String recoveryToken) { this.recoveryToken = recoveryToken; return this; }
        public UserDtoBuilder customerId(Long customerId) { this.customerId = customerId; return this; }
        public UserDtoBuilder activeCompanyId(Long activeCompanyId) { this.activeCompanyId = activeCompanyId; return this; }
        public UserDtoBuilder tenant_id(Long tenant_id) { this.tenant_id = tenant_id; return this; }
        public UserDtoBuilder company_id(Long company_id) { this.company_id = company_id; return this; }
        public UserDtoBuilder roles(List<RoleEntity> roles) { this.roles = roles; return this; }
        public UserDtoBuilder tenant(TenantEntity tenant) { this.tenant = tenant; this.customer = tenant; return this; }
        public UserDtoBuilder customer(TenantEntity customer) { this.customer = customer; this.tenant = customer; return this; }
        public UserDtoBuilder hasActiveSubscription(boolean hasActiveSubscription) { this.hasActiveSubscription = hasActiveSubscription; return this; }
        public UserDtoBuilder channelConfig(ChannelConfigDTO channelConfig) { this.channelConfig = channelConfig; return this; }
        public UserDto build() { return new UserDto(id, nombres, apellidos, username, email, isEnabled, accountNoExpired, accountNoLocked, credentialNoExpired, verificationToken, recoveryToken, customerId, activeCompanyId, tenant_id, company_id, roles, tenant, customer, hasActiveSubscription, channelConfig); }
    }

    public static UserDtoBuilder builder() { return new UserDtoBuilder(); }
}
