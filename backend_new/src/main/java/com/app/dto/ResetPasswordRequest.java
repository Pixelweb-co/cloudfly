package com.app.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class ResetPasswordRequest {
    @JsonProperty("token")
    private String token;
    @JsonProperty("newPassword")
    private String newPassword;

    public ResetPasswordRequest() {}
    public ResetPasswordRequest(String token, String newPassword) {
        this.token = token;
        this.newPassword = newPassword;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    public String getNewPassword() { return newPassword; }
    public void setNewPassword(String newPassword) { this.newPassword = newPassword; }
}
