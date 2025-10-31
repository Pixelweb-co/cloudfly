package com.app.starter1.persistence.services;

import com.app.starter1.dto.ClienteContratoRequest;
import com.app.starter1.dto.CustomerDTO;
import com.app.starter1.persistence.entity.Contrato;
import com.app.starter1.persistence.entity.Customer;
import com.app.starter1.persistence.repository.ContratoRepository;
import com.app.starter1.persistence.repository.CustomerRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class CustomerService {

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    ContratoRepository contratoRepository;

    // Obtener todos los clientes
    public List<Customer> getAllCustomersWithContracts() {
        return customerRepository.findAll();
    }

    public Customer createCustomer(ClienteContratoRequest request) {
        Customer customer = Customer.builder()
                .name(request.getName())
                .nit(request.getNit())
                .phone(request.getPhone())
                .email(request.getEmail())
                .address(request.getAddress())
                .contact(request.getContact())
                .position(request.getPosition())
                .type(request.getType())
                .status(request.getStatus() == 1)
                .build();

        return customerRepository.save(customer);
    }

    public Customer updateCustomerAndContract(Long customerId, Customer updatedCustomer, Contrato updatedContrato) {
        // Buscar el cliente existente por su ID
        Optional<Customer> existingCustomerOptional = customerRepository.findById(customerId);

        if (existingCustomerOptional.isEmpty()) {
            throw new RuntimeException("Customer not found with ID: " + customerId);
        }

        Customer existingCustomer = existingCustomerOptional.get();

        // Actualizar los datos del cliente
        existingCustomer.setName(updatedCustomer.getName());
        existingCustomer.setNit(updatedCustomer.getNit());
        existingCustomer.setPhone(updatedCustomer.getPhone());
        existingCustomer.setEmail(updatedCustomer.getEmail());
        existingCustomer.setAddress(updatedCustomer.getAddress());
        existingCustomer.setContact(updatedCustomer.getContact());
        existingCustomer.setPosition(updatedCustomer.getPosition());
        existingCustomer.setType(updatedCustomer.getType());
        existingCustomer.setStatus(updatedCustomer.getStatus());

        // Actualizar o crear el contrato asociado
        if (existingCustomer.getContrato() != null) {
            // Actualizar contrato existente
            Contrato existingContrato = existingCustomer.getContrato();
            existingContrato.setFechaInicio(updatedContrato.getFechaInicio());
            existingContrato.setFechaFinal(updatedContrato.getFechaFinal());
            existingContrato.setDescripcionContrato(updatedContrato.getDescripcionContrato());
            existingContrato.setEstado(updatedContrato.getEstado());
        } else {
            // Crear nuevo contrato y asociarlo al cliente
            Contrato newContrato = new Contrato();
            newContrato.setFechaInicio(updatedContrato.getFechaInicio());
            newContrato.setFechaFinal(updatedContrato.getFechaFinal());
            newContrato.setDescripcionContrato(updatedContrato.getDescripcionContrato());
            newContrato.setEstado(updatedContrato.getEstado());
            newContrato.setCliente(existingCustomer); // Asocia el contrato al cliente
            existingCustomer.setContrato(newContrato); // Asocia el cliente al contrato
        }

        // Guardar los cambios del cliente (esto persiste también el contrato asociado)
        return customerRepository.save(existingCustomer);
    }


    // DELETE
    public void deleteCustomer(Long id) {
        Optional<Customer> customer = customerRepository.findById(id);
        customerRepository.deleteById(id);
    }
    // READ (Get contract by customer ID)
    public Contrato getContratoByCustomerId(Long customerId) {
        return contratoRepository.findByClienteId(customerId)
                .orElseThrow(() -> new EntityNotFoundException("Contract not found for customer ID: " + customerId));
    }
    // CREATE or UPDATE CONTRACT
    public Contrato createOrUpdateContrato(Long customerId, Contrato contrato) {
        Optional<Contrato> contratoOptional = contratoRepository.findById(customerId);
        Optional<Customer> customer = customerRepository.findById(customerId);

        Contrato existingContrato = contratoOptional.get();
        Customer existingCliente = customer.get();
         existingContrato.setCliente(existingCliente);
        return contratoRepository.save(contrato);
    }




    // DELETE CONTRACT
    public void deleteContrato(Long contratoId) {
        Contrato contrato = contratoRepository.findById(contratoId)
                .orElseThrow(() -> new EntityNotFoundException("Contract not found with ID: " + contratoId));
        contratoRepository.delete(contrato);
    }

    public Customer getById(Long id) {
        return customerRepository.findById(id).orElseThrow(() -> new RuntimeException("Cliente no encontrado"));
    }
}
