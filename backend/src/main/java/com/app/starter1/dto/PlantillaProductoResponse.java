package com.app.starter1.dto;


import com.app.starter1.persistence.entity.Plantilla;
import com.app.starter1.persistence.entity.Product;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Data
@AllArgsConstructor
@Setter
@Getter
public class PlantillaProductoResponse {
    private Product producto;
    private List<Plantilla> plantillas;
}
