package com.app.starter1.utils;

import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Gestor centralizado de tokens OAuth state
 * Para compartir entre FacebookOAuthController e InstagramOAuthController
 */
@Component
public class OAuthStateManager {

    private final Map<String, StateData> stateTokens = new ConcurrentHashMap<>();

    public String generateStateToken(Long tenantId, String platform) {
        String state = UUID.randomUUID().toString();
        stateTokens.put(state, new StateData(tenantId, platform));
        return state;
    }

    public StateData validateAndRemove(String state) {
        return stateTokens.remove(state);
    }

    public static class StateData {
        private final Long tenantId;
        private final String platform; // "facebook" o "instagram"

        public StateData(Long tenantId, String platform) {
            this.tenantId = tenantId;
            this.platform = platform;
        }

        public Long getTenantId() {
            return tenantId;
        }

        public String getPlatform() {
            return platform;
        }
    }
}
