package com.app.starter1.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SignRequest {
    private MultipartFile file;          // Archivo en formato binario
    private Long user_id;
    private String name;// ID del producto
}