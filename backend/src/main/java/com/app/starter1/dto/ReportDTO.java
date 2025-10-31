package com.app.starter1.dto;

import com.app.starter1.persistence.entity.Plantilla;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportDTO {
    private Long id;
    private Long idSolicitud;
    private String ciudad;
    private String ubicacion;
    private String resumen; // Será mapeado a trabajoRealizado
    private String observacion; // Será mapeado a observaciones
    private Integer estadoEquipo; // Será mapeado a estadoEquipo
    private List<PlantillaDTO> plantillas;
    private List<PlantillaVerificationDTO> vtemplatesData;
}

