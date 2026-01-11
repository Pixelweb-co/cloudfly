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

    @Autowired
    private com.app.starter1.persistence.repository.PlanRepository planRepository;

    @Autowired
    private SubscriptionService subscriptionService;

    // Obtener todos los clientes
    public List<Customer> getAllCustomersWithContracts() {
        return customerRepository.findAll();
    }

    /**
     * Crear cliente desde ClienteContratoRequest (mantiene compatibilidad)
     */
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
                // Map DIAN Fields
                .tipoDocumentoDian(request.getTipoDocumentoDian())
                .digitoVerificacion(request.getDigitoVerificacion())
                .razonSocial(request.getRazonSocial())
                .nombreComercial(request.getNombreComercial())
                .responsabilidadesFiscales(request.getResponsabilidadesFiscales())
                .regimenFiscal(request.getRegimenFiscal())
                .obligacionesDian(request.getObligacionesDian())
                .codigoDaneCiudad(request.getCodigoDaneCiudad())
                .ciudadDian(request.getCiudadDian())
                .codigoDaneDepartamento(request.getCodigoDaneDepartamento())
                .departamentoDian(request.getDepartamentoDian())
                .paisCodigo(request.getPaisCodigo())
                .paisNombre(request.getPaisNombre())
                .codigoPostal(request.getCodigoPostal())
                .actividadEconomicaCiiu(request.getActividadEconomicaCiiu())
                .actividadEconomicaDescripcion(request.getActividadEconomicaDescripcion())
                .emailFacturacionDian(request.getEmailFacturacionDian())
                .sitioWeb(request.getSitioWeb())
                .representanteLegalNombre(request.getRepresentanteLegalNombre())
                .representanteLegalTipoDoc(request.getRepresentanteLegalTipoDoc())
                .representanteLegalNumeroDoc(request.getRepresentanteLegalNumeroDoc())
                .esEmisorFE(request.getEsEmisorFE())
                .esEmisorPrincipal(request.getEsEmisorPrincipal())
                .notasDian(request.getNotasDian())
                .build();

        Customer savedCustomer = customerRepository.save(customer);

        // Buscar el plan gratuito activo y crear suscripción automáticamente
        try {
            Optional<com.app.starter1.persistence.entity.Plan> freePlan = planRepository.findByIsFreeAndIsActive(true,
                    true);

            if (freePlan.isPresent()) {
                com.app.starter1.dto.SubscriptionCreateRequest subscriptionRequest = new com.app.starter1.dto.SubscriptionCreateRequest(
                        freePlan.get().getId(),
                        savedCustomer.getId(),
                        com.app.starter1.persistence.entity.BillingCycle.MONTHLY,
                        false, // autoRenew
                        null, // customModuleIds
                        null, // customAiTokensLimit
                        null, // customElectronicDocsLimit
                        null, // customUsersLimit
                        null, // customMonthlyPrice
                        null, // discountPercent
                        "Suscripción automática al plan gratuito");

                subscriptionService.createSubscriptionFromPlan(subscriptionRequest);
                System.out.println(
                        "Suscripción gratuita creada automáticamente para el customer: " + savedCustomer.getName());
            } else {
                System.out.println(
                        "ADVERTENCIA: No se encontró un plan gratuito activo. El customer fue creado sin suscripción.");
            }
        } catch (Exception e) {
            System.err.println("Error al crear suscripción automática: " + e.getMessage());
            // No lanzamos la excepción para no fallar la creación del customer
        }

        return savedCustomer;
    }

    /**
     * Actualizar cliente con todos los campos incluyendo DIAN
     */
    public Customer updateCustomerAndContract(Long customerId, Customer updatedCustomer) {
        // Buscar el cliente existente por su ID
        Optional<Customer> existingCustomerOptional = customerRepository.findById(customerId);

        if (existingCustomerOptional.isEmpty()) {
            throw new RuntimeException("Customer not found with ID: " + customerId);
        }

        Customer existingCustomer = existingCustomerOptional.get();

        // Actualizar campos básicos
        existingCustomer.setName(updatedCustomer.getName());
        existingCustomer.setNit(updatedCustomer.getNit());
        existingCustomer.setPhone(updatedCustomer.getPhone());
        existingCustomer.setEmail(updatedCustomer.getEmail());
        existingCustomer.setAddress(updatedCustomer.getAddress());
        existingCustomer.setContact(updatedCustomer.getContact());
        existingCustomer.setPosition(updatedCustomer.getPosition());
        existingCustomer.setType(updatedCustomer.getType());
        existingCustomer.setStatus(updatedCustomer.getStatus());
        existingCustomer.setLogoUrl(updatedCustomer.getLogoUrl());
        existingCustomer.setBusinessType(updatedCustomer.getBusinessType());
        existingCustomer.setBusinessDescription(updatedCustomer.getBusinessDescription());

        // Actualizar campos DIAN
        existingCustomer.setTipoDocumentoDian(updatedCustomer.getTipoDocumentoDian());
        existingCustomer.setDigitoVerificacion(updatedCustomer.getDigitoVerificacion());
        existingCustomer.setRazonSocial(updatedCustomer.getRazonSocial());
        existingCustomer.setNombreComercial(updatedCustomer.getNombreComercial());
        existingCustomer.setResponsabilidadesFiscales(updatedCustomer.getResponsabilidadesFiscales());
        existingCustomer.setRegimenFiscal(updatedCustomer.getRegimenFiscal());
        existingCustomer.setObligacionesDian(updatedCustomer.getObligacionesDian());
        existingCustomer.setCodigoDaneCiudad(updatedCustomer.getCodigoDaneCiudad());
        existingCustomer.setCiudadDian(updatedCustomer.getCiudadDian());
        existingCustomer.setCodigoDaneDepartamento(updatedCustomer.getCodigoDaneDepartamento());
        existingCustomer.setDepartamentoDian(updatedCustomer.getDepartamentoDian());
        existingCustomer.setPaisCodigo(updatedCustomer.getPaisCodigo());
        existingCustomer.setPaisNombre(updatedCustomer.getPaisNombre());
        existingCustomer.setCodigoPostal(updatedCustomer.getCodigoPostal());
        existingCustomer.setActividadEconomicaCiiu(updatedCustomer.getActividadEconomicaCiiu());
        existingCustomer.setActividadEconomicaDescripcion(updatedCustomer.getActividadEconomicaDescripcion());
        existingCustomer.setEmailFacturacionDian(updatedCustomer.getEmailFacturacionDian());
        existingCustomer.setSitioWeb(updatedCustomer.getSitioWeb());
        existingCustomer.setRepresentanteLegalNombre(updatedCustomer.getRepresentanteLegalNombre());
        existingCustomer.setRepresentanteLegalTipoDoc(updatedCustomer.getRepresentanteLegalTipoDoc());
        existingCustomer.setRepresentanteLegalNumeroDoc(updatedCustomer.getRepresentanteLegalNumeroDoc());
        existingCustomer.setEsEmisorFE(updatedCustomer.getEsEmisorFE());
        existingCustomer.setEsEmisorPrincipal(updatedCustomer.getEsEmisorPrincipal());
        existingCustomer.setNotasDian(updatedCustomer.getNotasDian());

        // Guardar los cambios del cliente
        return customerRepository.save(existingCustomer);
    }

    /**
     * Convertir Entity a DTO con todos los campos DIAN
     */
    public CustomerDTO entityToDTO(Customer customer) {
        if (customer == null)
            return null;

        return CustomerDTO.builder()
                // Campos básicos
                .id(customer.getId())
                .name(customer.getName())
                .nit(customer.getNit())
                .phone(customer.getPhone())
                .email(customer.getEmail())
                .address(customer.getAddress())
                .contact(customer.getContact())
                .position(customer.getPosition())
                .type(customer.getType())
                .status(customer.getStatus())
                .logoUrl(customer.getLogoUrl())
                .dateRegister(customer.getDateRegister())
                .businessType(customer.getBusinessType() != null ? customer.getBusinessType().name() : null)
                .businessDescription(customer.getBusinessDescription())
                // Campos DIAN
                .tipoDocumentoDian(customer.getTipoDocumentoDian())
                .digitoVerificacion(customer.getDigitoVerificacion())
                .razonSocial(customer.getRazonSocial())
                .nombreComercial(customer.getNombreComercial())
                .responsabilidadesFiscales(customer.getResponsabilidadesFiscales())
                .regimenFiscal(customer.getRegimenFiscal())
                .obligacionesDian(customer.getObligacionesDian())
                .codigoDaneCiudad(customer.getCodigoDaneCiudad())
                .ciudadDian(customer.getCiudadDian())
                .codigoDaneDepartamento(customer.getCodigoDaneDepartamento())
                .departamentoDian(customer.getDepartamentoDian())
                .paisCodigo(customer.getPaisCodigo())
                .paisNombre(customer.getPaisNombre())
                .codigoPostal(customer.getCodigoPostal())
                .actividadEconomicaCiiu(customer.getActividadEconomicaCiiu())
                .actividadEconomicaDescripcion(customer.getActividadEconomicaDescripcion())
                .emailFacturacionDian(customer.getEmailFacturacionDian())
                .sitioWeb(customer.getSitioWeb())
                .representanteLegalNombre(customer.getRepresentanteLegalNombre())
                .representanteLegalTipoDoc(customer.getRepresentanteLegalTipoDoc())
                .representanteLegalNumeroDoc(customer.getRepresentanteLegalNumeroDoc())
                .esEmisorFE(customer.getEsEmisorFE())
                .esEmisorPrincipal(customer.getEsEmisorPrincipal())
                .notasDian(customer.getNotasDian())
                .createdAt(customer.getCreatedAt())
                .updatedAt(customer.getUpdatedAt())
                .build();
    }

    // DELETE
    public void deleteCustomer(Long id) {
        Optional<Customer> customer = customerRepository.findById(id);
        customerRepository.deleteById(id);
    }

    public Customer getById(Long id) {
        return customerRepository.findById(id).orElseThrow(() -> new RuntimeException("Cliente no encontrado"));
    }
}
