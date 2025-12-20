package com.notification.service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PayrollNotificationMessage {
    private String phoneNumber;
    private String employeeName;
    private String periodName;
    private double netPay;
    private String pdfUrl;
    private String pdfBase64;
}
