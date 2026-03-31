package com.app.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class ForgotPasswordRequest {
    @JsonProperty("email")
    private String email;

    public ForgotPasswordRequest() {}
    public ForgotPasswordRequest(String email) {
        this.email = email;
    }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
}
