package com.app.starter1.dto;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Data
@Getter
@Setter
public class PlantillaRequest {
    private String marca;
    private String modelo;
    private Long tipoElement;
    private List<Campo> campos;

    @Data
    public static class Campo {
        private String nom;
        private Long tipo;
    }
}

