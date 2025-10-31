package com.app.starter1.persistence.services;
import com.app.starter1.dto.ClienteContratoRequest;
import com.app.starter1.persistence.entity.Customer;
import com.app.starter1.dto.CustomerDTO;
import com.app.starter1.persistence.entity.Contrato;
import com.app.starter1.persistence.repository.ContratoRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class ContractService {

    @Autowired
    private ContratoRepository contratoRepository;

    public Contrato createContrato(Customer cliente, ClienteContratoRequest request) {

        System.out.println(request.getFechaInicio());

        Contrato contrato = Contrato.builder()
                .fechaInicio(LocalDate.parse(request.getFechaInicio()))
                .fechaFinal(LocalDate.parse(request.getFechaFinal()))
                .descripcionContrato(request.getDescripcionContrato())
                //.estado(request.getStatus())
                .cliente(cliente)
                .estado("1")
                .build();

        return contratoRepository.save(contrato);
    }

    // Método para guardar contratos
    @Transactional
    public Contrato save(Contrato contrato) {
        return contratoRepository.save(contrato);
    }

    // Método para actualizar un contrato existente
    @Transactional
    public Contrato updateEntityFromDTO(Contrato existingContract, CustomerDTO customerDTO) {


        return contratoRepository.save(existingContract);
    }

    // Método para obtener un contrato por su ID
    @Transactional
    public Contrato findById(Long id) {
        return contratoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Contrato not found"));
    }

    // Método para eliminar un contrato por su ID
    @Transactional
    public void deleteById(Long id) {
        if (!contratoRepository.existsById(id)) {
            throw new RuntimeException("Contrato not found");
        }
        contratoRepository.deleteById(id);
    }

    // Método para obtener todos los contratos
    @Transactional
    public List<Contrato> findAll() {
        return contratoRepository.findAll();
    }

    public Optional<Contrato> findByClienteId(Long clienteId) {
        return contratoRepository.findByClienteId(clienteId);
    }

    // Método para eliminar todos los contratos
    @Transactional
    public void deleteAll() {
        contratoRepository.deleteAll();
    }
}


