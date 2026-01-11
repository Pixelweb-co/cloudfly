package com.app.starter1.controllers;

import com.app.starter1.dto.*;
import com.app.starter1.persistence.entity.Customer;
import com.app.starter1.persistence.entity.UserEntity;
import com.app.starter1.persistence.repository.CustomerRepository;
import com.app.starter1.persistence.repository.UserRepository;
import com.app.starter1.persistence.services.CustomerService;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/customers")
public class CustomerController {

    @Autowired
    private CustomerService customerService;

    @Autowired
    CustomerRepository customerRepository;

    @Autowired
    UserRepository userRepository;

    @PostMapping
    public ResponseEntity<?> createClienteYContrato(@RequestBody ClienteContratoRequest request) {
        // Crear el cliente
        Customer cliente = customerService.createCustomer(request);

        return ResponseEntity.ok(Map.of(
                "cliente", cliente

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
        updatedCustomer.setLogoUrl((String) payload.get("logoUrl"));
        updatedCustomer.setBusinessType(
                payload.get("businessType") != null ? com.app.starter1.persistence.entity.Customer.BusinessType
                        .valueOf((String) payload.get("businessType")) : null);
        updatedCustomer.setBusinessDescription((String) payload.get("businessDescription"));

        // DIAN Fields Extraction
        updatedCustomer.setTipoDocumentoDian((String) payload.get("tipoDocumentoDian"));
        updatedCustomer.setDigitoVerificacion((String) payload.get("digitoVerificacion"));
        updatedCustomer.setRazonSocial((String) payload.get("razonSocial"));
        updatedCustomer.setNombreComercial((String) payload.get("nombreComercial"));
        updatedCustomer.setResponsabilidadesFiscales((String) payload.get("responsabilidadesFiscales"));
        updatedCustomer.setRegimenFiscal((String) payload.get("regimenFiscal"));
        updatedCustomer.setObligacionesDian((String) payload.get("obligacionesDian"));
        updatedCustomer.setCodigoDaneCiudad((String) payload.get("codigoDaneCiudad"));
        updatedCustomer.setCiudadDian((String) payload.get("ciudadDian"));
        updatedCustomer.setCodigoDaneDepartamento((String) payload.get("codigoDaneDepartamento"));
        updatedCustomer.setDepartamentoDian((String) payload.get("departamentoDian"));
        updatedCustomer.setPaisCodigo((String) payload.get("paisCodigo"));
        updatedCustomer.setPaisNombre((String) payload.get("paisNombre"));
        updatedCustomer.setCodigoPostal((String) payload.get("codigoPostal"));
        updatedCustomer.setActividadEconomicaCiiu((String) payload.get("actividadEconomicaCiiu"));
        updatedCustomer.setActividadEconomicaDescripcion((String) payload.get("actividadEconomicaDescripcion"));
        updatedCustomer.setEmailFacturacionDian((String) payload.get("emailFacturacionDian"));
        updatedCustomer.setSitioWeb((String) payload.get("sitioWeb"));
        updatedCustomer.setRepresentanteLegalNombre((String) payload.get("representanteLegalNombre"));
        updatedCustomer.setRepresentanteLegalTipoDoc((String) payload.get("representanteLegalTipoDoc"));
        updatedCustomer.setRepresentanteLegalNumeroDoc((String) payload.get("representanteLegalNumeroDoc"));
        updatedCustomer.setEsEmisorFE(payload.get("esEmisorFE") != null ? (Boolean) payload.get("esEmisorFE") : false);
        updatedCustomer.setEsEmisorPrincipal(
                payload.get("esEmisorPrincipal") != null ? (Boolean) payload.get("esEmisorPrincipal") : false);
        updatedCustomer.setNotasDian((String) payload.get("notasDian"));
        Customer savedCustomer = customerService.updateCustomerAndContract(customerId, updatedCustomer);

        return ResponseEntity.ok(savedCustomer);
    }

    // DELETE CUSTOMER
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCustomer(@PathVariable Long id) {
        customerService.deleteCustomer(id);
        return ResponseEntity.noContent().build();
    }

}
