package com.marketing.worker.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CampaignPayload {
    private Long campaignId;
    private Long tenantId;
    private Long companyId;
}
