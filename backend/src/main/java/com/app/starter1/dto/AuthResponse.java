package com.app.starter1.dto;


import com.app.starter1.persistence.entity.UserEntity;
import com.fasterxml.jackson.annotation.JsonPropertyOrder;

@JsonPropertyOrder({"username","message","jwt","status","user"})
public record AuthResponse (

        String username,
        String message,
        String jwt,
        boolean status,
        UserEntity userEntity
){


};
