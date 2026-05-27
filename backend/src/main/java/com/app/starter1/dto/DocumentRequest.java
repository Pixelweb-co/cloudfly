package com.app.starter1.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DocumentRequest {
    private MultipartFile file;          // Archivo en formato binario
    private String tag;           // Etiqueta
    private boolean isReport;     // Indicador de si es un reporte
    private Long product_id;        // ID del producto
}