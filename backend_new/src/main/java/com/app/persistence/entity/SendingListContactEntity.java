package com.app.persistence.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("sending_list_contacts")
public class SendingListContactEntity {
    @Id
    private Long id;

    @Column("sending_list_id")
    private Long sendingListId;

    @Column("contact_id")
    private Long contactId;

    private String status; // enum: ACTIVE, UNSUBSCRIBED, BOUNCED

    @Column("added_at")
    private LocalDateTime addedAt;

    // Explicit Getters and Setters for VPS compatibility
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getSendingListId() { return sendingListId; }
    public void setSendingListId(Long sendingListId) { this.sendingListId = sendingListId; }
    public Long getContactId() { return contactId; }
    public void setContactId(Long contactId) { this.contactId = contactId; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getAddedAt() { return addedAt; }
    public void setAddedAt(LocalDateTime addedAt) { this.addedAt = addedAt; }
}
