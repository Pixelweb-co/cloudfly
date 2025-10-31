package com.app.starter1.dto;

import com.app.starter1.persistence.entity.Contrato;
import com.app.starter1.persistence.entity.Customer;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ClienteContratoResponse {
    private Customer cliente;
    private Contrato contrato;
}
