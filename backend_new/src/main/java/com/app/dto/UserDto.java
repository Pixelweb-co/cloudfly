package com.app.dto;

import com.app.persistence.entity.TenantEntity;
import com.app.persistence.entity.RoleEntity;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
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
    private List<RoleEntity> roles;
    private TenantEntity tenant;
    private boolean hasActiveSubscription;
    private ChatbotConfigDTO chatbotConfig;
}
