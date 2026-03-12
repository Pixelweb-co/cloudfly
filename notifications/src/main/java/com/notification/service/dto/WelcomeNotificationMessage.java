package com.notification.service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WelcomeNotificationMessage {
    private String phoneNumber;
    private String customerName;
    private String contactName;
    private String email;
    private String businessType;
}
