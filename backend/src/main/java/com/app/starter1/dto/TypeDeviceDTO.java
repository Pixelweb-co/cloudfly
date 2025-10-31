package com.app.starter1.dto;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Data
@Getter
@Setter
public class TypeDeviceDTO {
    private Long id;
    private String typeDevice;
    private String plantillaVerificacion;


    // Constructor con todos los campos
    public TypeDeviceDTO(Long id, String typeDevice,String plantillaVerificacion) {
        this.id = id;
        this.typeDevice = typeDevice;
        this.plantillaVerificacion = plantillaVerificacion;

    }


}
