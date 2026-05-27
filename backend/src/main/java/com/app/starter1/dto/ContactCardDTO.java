package com.app.starter1.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContactCardDTO {
    private Long contactId;
    private String name;
    private String avatarUrl;
    private String externalId; // phone, PSID, etc.
    private String lastMessage;
    private LocalDateTime lastMessageTime;
    private Integer unreadCount;
    private String stage; // LEAD, POTENTIAL, CLIENT
    private String conversationId;
    private String platform; // WHATSAPP, FACEBOOK, INSTAGRAM
}
