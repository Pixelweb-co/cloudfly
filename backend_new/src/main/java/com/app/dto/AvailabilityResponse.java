package com.app.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class AvailabilityResponse {
    @JsonProperty("isAvailable")
    private boolean isAvailable;
    private String message;

    public AvailabilityResponse() {}
    public AvailabilityResponse(boolean isAvailable, String message) {
        this.isAvailable = isAvailable;
        this.message = message;
    }

    public boolean isAvailable() { return isAvailable; }
    public void setAvailable(boolean available) { isAvailable = available; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public static class AvailabilityResponseBuilder {
        private boolean isAvailable;
        private String message;

        public AvailabilityResponseBuilder isAvailable(boolean isAvailable) { this.isAvailable = isAvailable; return this; }
        public AvailabilityResponseBuilder message(String message) { this.message = message; return this; }
        public AvailabilityResponse build() { return new AvailabilityResponse(isAvailable, message); }
    }

    public static AvailabilityResponseBuilder builder() {
        return new AvailabilityResponseBuilder();
    }
}
