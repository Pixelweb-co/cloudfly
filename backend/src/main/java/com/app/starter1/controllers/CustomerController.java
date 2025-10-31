package com.app.starter1.controllers;


import com.app.starter1.dto.*;
import com.app.starter1.persistence.entity.Contrato;
import com.app.starter1.persistence.entity.Customer;
import com.app.starter1.persistence.entity.UserEntity;
import com.app.starter1.persistence.repository.CustomerRepository;
import com.app.starter1.persistence.repository.UserRepository;
import com.app.starter1.persistence.services.ContractService;
import com.app.starter1.persistence.services.CustomerService;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/customers")
public class CustomerController {

    @Autowired
    private CustomerService customerService;

    @Autowired
    ContractService contractService;

    @Autowired
    CustomerRepository customerRepository;

    @Autowired
    UserRepository userRepository;

    @PostMapping
    public ResponseEntity<?> createClienteYContrato(@RequestBody ClienteContratoRequest request) {
        // Crear el cliente
        Customer cliente = customerService.createCustomer(request);

        // Crear el contrato asociando el cliente creado
        Contrato contrato = contractService.createContrato(cliente, request);

        return ResponseEntity.ok(Map.of(
                "cliente", cliente,
                "contrato", contrato
        ));
    }

    @PostMapping("/account-setup")
    public ResponseEntity<?> accountSetup(@RequestBody ClienteSinContratoRequest request) {
        // Crear el cliente

        // Buscar el usuario por ID
        UserEntity user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con ID: " + request.getUserId()));

        // Obtener los datos del cliente desde el objeto form
        ClienteForm form = request.getForm();

        // Crear el cliente
        Customer customer = Customer.builder()
                .name(form.getName())
                .nit(form.getNit())
                .phone(form.getPhone())
                .email(form.getEmail())
                .address(form.getAddress())
                .contact(form.getContact())
                .position(form.getPosition())
                .type(form.getType())
                .status(form.getStatus() != null ? Boolean.valueOf(form.getStatus()) : null)
                .build();

        ClienteContratoRequest contratoRequest = new ClienteContratoRequest();

        contratoRequest.setDescripcionContrato("");
        contratoRequest.setFechaInicio("2000-01-01");
        contratoRequest.setFechaFinal("2000-01-01");

        // Asociar el cliente al usuario
        customer = customerRepository.save(customer);
        user.setCustomer(customer);
        UserEntity userSaved = userRepository.save(user);

        // Crear el contrato asociando el cliente creado
        Contrato contrato = contractService.createContrato(customer, contratoRequest);



        return ResponseEntity.ok(userSaved);
    }



    @GetMapping
    @Transactional

    public ResponseEntity<List<Customer>> getAllCustomersWithContracts() {
        List<Customer> customers = customerService.getAllCustomersWithContracts();
        return ResponseEntity.ok(customers);
    }

    // GET CUSTOMER BY ID
    @GetMapping("/{id}")
    public ResponseEntity<Customer> getCustomerById(@PathVariable Long id) {
        return ResponseEntity.ok(customerRepository.getById(id));
    }

    // UPDATE CUSTOMER
    @PutMapping("/{customerId}")
    public ResponseEntity<Customer> updateCustomerAndContract(
            @PathVariable Long customerId,
            @RequestBody Map<String, Object> payload) {
        // Dividir los datos en cliente y contrato
        Customer updatedCustomer = new Customer();
        updatedCustomer.setName((String) payload.get("name"));
        updatedCustomer.setNit((String) payload.get("nit"));
        updatedCustomer.setPhone((String) payload.get("phone"));
        updatedCustomer.setEmail((String) payload.get("email"));
        updatedCustomer.setAddress((String) payload.get("address"));
        updatedCustomer.setContact((String) payload.get("contact"));
        updatedCustomer.setPosition((String) payload.get("position"));
        updatedCustomer.setType((String) payload.get("type"));
        updatedCustomer.setStatus(Boolean.valueOf((String) payload.get("status")));

        Contrato updatedContrato = new Contrato();
        updatedContrato.setFechaInicio(LocalDate.parse((String) payload.get("fechaInicio")));
        updatedContrato.setFechaFinal(LocalDate.parse((String) payload.get("fechaFinal")));
        updatedContrato.setDescripcionContrato((String) payload.get("descripcionContrato"));
        updatedContrato.setEstado("1");

        // Actualizar cliente y contrato
        Customer savedCustomer = customerService.updateCustomerAndContract(customerId, updatedCustomer, updatedContrato);

        return ResponseEntity.ok(savedCustomer);
    }

    // DELETE CUSTOMER
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCustomer(@PathVariable Long id) {
        customerService.deleteCustomer(id);
        return ResponseEntity.noContent().build();
    }


    // GET CONTRACT BY CUSTOMER ID
    @GetMapping("/{customerId}/contracts")
    public ResponseEntity<Contrato> getContratoByCustomerId(@PathVariable Long customerId) {
        return ResponseEntity.ok(customerService.getContratoByCustomerId(customerId));
    }

    // DELETE CONTRACT
    @DeleteMapping("/contracts/{id}")
    public ResponseEntity<Void> deleteContrato(@PathVariable Long id) {
        customerService.deleteContrato(id);
        return ResponseEntity.noContent().build();
    }
}
