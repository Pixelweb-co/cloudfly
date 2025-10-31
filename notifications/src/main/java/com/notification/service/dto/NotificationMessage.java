package com.notification.service.dto;

public class NotificationMessage {
    private String to;
    private String subject;
    private String body;
    private String type;
    private String username;


    // Getters y setters
    public String getTo() {
        return to;
    }

    public void setTo(String to) {
        this.to = to;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public String getBody() {
        return body;
    }

    public void setBody(String body) {
        this.body = body;
    }

    public void setUsername(String username){this.username = username;}

    public String getUsername() {
        return username;
    }
}
