package com.app.dto;

import lombok.Data;

@Data
public class TenantPaymentGatewayDTO {
    private Long id;
    private Long tenantId;
    private Long companyId;
    private String provider;
    private String publicKey;
    private String privateKeyEncrypted;
    private String eventsSecret;
}
