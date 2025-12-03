package com.app.starter1.persistence.services;

import com.app.starter1.dto.ClienteContratoRequest;
import com.app.starter1.dto.CustomerDTO;
import com.app.starter1.persistence.entity.Customer;
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

    public Customer updateCustomerAndContract(Long customerId, Customer updatedCustomer) {
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


        // Guardar los cambios del cliente (esto persiste también el contrato asociado)
        return customerRepository.save(existingCustomer);
    }


    // DELETE
    public void deleteCustomer(Long id) {
        Optional<Customer> customer = customerRepository.findById(id);
        customerRepository.deleteById(id);
    }

    // CREATE or UPDATE CONTRACT


    public Customer getById(Long id) {
        return customerRepository.findById(id).orElseThrow(() -> new RuntimeException("Cliente no encontrado"));
    }
}
