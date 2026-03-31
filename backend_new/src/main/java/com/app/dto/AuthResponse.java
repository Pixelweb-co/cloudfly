package com.app.dto;

public class AuthResponse {
    private String username;
    private String message;
    private String jwt;
    private boolean status;
    private UserDto user;

    public AuthResponse() {}
    public AuthResponse(String username, String message, String jwt, boolean status, UserDto user) {
        this.username = username;
        this.message = message;
        this.jwt = jwt;
        this.status = status;
        this.user = user;
    }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getJwt() { return jwt; }
    public void setJwt(String jwt) { this.jwt = jwt; }
    public boolean isStatus() { return status; }
    public void setStatus(boolean status) { this.status = status; }
    public UserDto getUser() { return user; }
    public void setUser(UserDto user) { this.user = user; }

    // Minimal manual builder for compatibility if needed
    public static class AuthResponseBuilder {
        private String username;
        private String message;
        private String jwt;
        private boolean status;
        private UserDto user;

        public AuthResponseBuilder username(String username) { this.username = username; return this; }
        public AuthResponseBuilder message(String message) { this.message = message; return this; }
        public AuthResponseBuilder jwt(String jwt) { this.jwt = jwt; return this; }
        public AuthResponseBuilder status(boolean status) { this.status = status; return this; }
        public AuthResponseBuilder user(UserDto user) { this.user = user; return this; }
        public AuthResponse build() { return new AuthResponse(username, message, jwt, status, user); }
    }

    public static AuthResponseBuilder builder() {
        return new AuthResponseBuilder();
    }
}
