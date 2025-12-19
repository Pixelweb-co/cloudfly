package com.app.starter1.services;

import com.app.starter1.dto.hr.PayrollConceptDTO;
import com.app.starter1.persistence.entity.PayrollConcept;
import com.app.starter1.persistence.entity.Customer;
import com.app.starter1.persistence.repository.PayrollConceptRepository;
import com.app.starter1.persistence.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PayrollConceptService {

        private final PayrollConceptRepository conceptRepository;
        private final CustomerRepository customerRepository;

        @Transactional(readOnly = true)
        public List<PayrollConceptDTO> getAllConcepts(Long customerId) {
                Customer customer = customerRepository.findById(customerId)
                                .orElseThrow(() -> new RuntimeException("Customer not found"));
                return conceptRepository.findByCustomerAndIsActiveTrueAndDeletedAtIsNull(customer)
                                .stream()
                                .map(this::convertToDTO)
                                .collect(Collectors.toList());
        }

        @Transactional(readOnly = true)
        public List<PayrollConceptDTO> getConceptsByType(Long customerId, PayrollConcept.ConceptType type) {
                Customer customer = customerRepository.findById(customerId)
                                .orElseThrow(() -> new RuntimeException("Customer not found"));
                return conceptRepository.findByCustomerAndConceptTypeAndIsActiveTrueAndDeletedAtIsNull(customer, type)
                                .stream()
                                .map(this::convertToDTO)
                                .collect(Collectors.toList());
        }

        @Transactional
        public PayrollConceptDTO createConcept(PayrollConceptDTO dto, Long customerId) {
                Customer customer = customerRepository.findById(customerId)
                                .orElseThrow(() -> new RuntimeException("Customer not found"));
                PayrollConcept concept = PayrollConcept.builder()
                                .customer(customer)
                                .conceptType(PayrollConcept.ConceptType.valueOf(dto.getConceptType()))
                                .code(dto.getCode())
                                .name(dto.getName())
                                .description(dto.getDescription())
                                .satCode(dto.getSatCode())
                                .isTaxable(dto.getIsTaxable())
                                .isImssSubject(dto.getIsImssSubject())
                                .calculationFormula(dto.getCalculationFormula())
                                .isSystemConcept(false)
                                .isActive(true)
                                .build();

                concept = conceptRepository.save(concept);
                return convertToDTO(concept);
        }

        @Transactional
        public void initializeDefaultConcepts(Long customerId) {
                Customer customer = customerRepository.findById(customerId)
                                .orElseThrow(() -> new RuntimeException("Customer not found"));
                // Inicializar conceptos predeterminados
                createDefaultConcept(customer, PayrollConcept.ConceptType.PERCEPCION, "001", "Sueldo Base", "001", true,
                                true);
                createDefaultConcept(customer, PayrollConcept.ConceptType.PERCEPCION, "002", "Aguinaldo", "002", true,
                                false);
                createDefaultConcept(customer, PayrollConcept.ConceptType.PERCEPCION, "021", "Prima Vacacional", "021",
                                true,
                                false);
                createDefaultConcept(customer, PayrollConcept.ConceptType.PERCEPCION, "019", "Horas Extra", "019", true,
                                true);

                createDefaultConcept(customer, PayrollConcept.ConceptType.DEDUCCION, "ISR", "ISR", "002", true, false);
                createDefaultConcept(customer, PayrollConcept.ConceptType.DEDUCCION, "IMSS", "IMSS", "001", false,
                                false);
        }

        private void createDefaultConcept(Customer customer, PayrollConcept.ConceptType type, String code,
                        String name, String satCode, boolean isTaxable, boolean isImss) {
                if (!conceptRepository.existsByCodeAndCustomer(code, customer)) {
                        PayrollConcept concept = PayrollConcept.builder()
                                        .customer(customer)
                                        .conceptType(type)
                                        .code(code)
                                        .name(name)
                                        .satCode(satCode)
                                        .isTaxable(isTaxable)
                                        .isImssSubject(isImss)
                                        .isSystemConcept(true)
                                        .isActive(true)
                                        .build();
                        conceptRepository.save(concept);
                }
        }

        @Transactional(readOnly = true)
        public PayrollConceptDTO getConceptById(Long id, Long customerId) {
                Customer customer = customerRepository.findById(customerId)
                                .orElseThrow(() -> new RuntimeException("Customer not found"));
                PayrollConcept concept = conceptRepository.findById(id)
                                .orElseThrow(() -> new RuntimeException("Concept not found"));

                if (!concept.getCustomer().getId().equals(customer.getId())) {
                        throw new RuntimeException("Concept does not belong to this customer");
                }

                return convertToDTO(concept);
        }

        @Transactional
        public PayrollConceptDTO updateConcept(Long id, PayrollConceptDTO dto, Long customerId) {
                Customer customer = customerRepository.findById(customerId)
                                .orElseThrow(() -> new RuntimeException("Customer not found"));
                PayrollConcept concept = conceptRepository.findById(id)
                                .orElseThrow(() -> new RuntimeException("Concept not found"));

                if (!concept.getCustomer().getId().equals(customer.getId())) {
                        throw new RuntimeException("Concept does not belong to this customer");
                }

                // Update fields
                if (dto.getName() != null)
                        concept.setName(dto.getName());
                if (dto.getCode() != null)
                        concept.setCode(dto.getCode());
                if (dto.getDescription() != null)
                        concept.setDescription(dto.getDescription());
                if (dto.getSatCode() != null)
                        concept.setSatCode(dto.getSatCode());
                if (dto.getConceptType() != null)
                        concept.setConceptType(PayrollConcept.ConceptType.valueOf(dto.getConceptType()));
                if (dto.getIsTaxable() != null)
                        concept.setIsTaxable(dto.getIsTaxable());
                if (dto.getIsImssSubject() != null)
                        concept.setIsImssSubject(dto.getIsImssSubject());
                if (dto.getCalculationFormula() != null)
                        concept.setCalculationFormula(dto.getCalculationFormula());
                if (dto.getIsActive() != null)
                        concept.setIsActive(dto.getIsActive());

                concept = conceptRepository.save(concept);
                return convertToDTO(concept);
        }

        @Transactional
        public void deleteConcept(Long id, Long customerId) {
                Customer customer = customerRepository.findById(customerId)
                                .orElseThrow(() -> new RuntimeException("Customer not found"));
                PayrollConcept concept = conceptRepository.findById(id)
                                .orElseThrow(() -> new RuntimeException("Concept not found"));

                if (!concept.getCustomer().getId().equals(customer.getId())) {
                        throw new RuntimeException("Concept does not belong to this customer");
                }

                // Soft delete - set deletedAt timestamp
                concept.setDeletedAt(java.time.LocalDateTime.now());
                concept.setIsActive(false);
                conceptRepository.save(concept);
        }

        private PayrollConceptDTO convertToDTO(PayrollConcept concept) {
                return PayrollConceptDTO.builder()
                                .id(concept.getId())
                                .conceptType(concept.getConceptType().name())
                                .code(concept.getCode())
                                .name(concept.getName())
                                .description(concept.getDescription())
                                .satCode(concept.getSatCode())
                                .isTaxable(concept.getIsTaxable())
                                .isImssSubject(concept.getIsImssSubject())
                                .calculationFormula(concept.getCalculationFormula())
                                .isSystemConcept(concept.getIsSystemConcept())
                                .isActive(concept.getIsActive())
                                .build();
        }
}
