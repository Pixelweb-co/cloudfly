package com.app.starter1.persistence.exeptions;

public class ErrorResponse {

    private String error;
    private String message;

    // Constructor
    public ErrorResponse(String error, String message) {
        this.error = error;
        this.message = message;
    }

    // Getters y setters
    public String getError() {
        return error;
    }

    public void setError(String error) {
        this.error = error;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
