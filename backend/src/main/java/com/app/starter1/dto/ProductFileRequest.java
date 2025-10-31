package com.app.starter1.dto;

import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

@Data
public class ProductFileRequest {
    private ProductoRequest productoRequest;
    private MultipartFile file;
}
