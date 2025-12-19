package com.app.starter1.services;

import com.app.starter1.dto.hr.PayrollConfigurationDTO;
import com.app.starter1.persistence.entity.Customer;
import com.app.starter1.persistence.entity.PayrollConfiguration;
import com.app.starter1.persistence.repository.CustomerRepository;
import com.app.starter1.persistence.repository.PayrollConfigurationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

/**
 * Servicio para gestionar la configuración de nómina por tenant
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PayrollConfigurationService {

    private final PayrollConfigurationRepository configRepository;
    private final CustomerRepository customerRepository;

    /**
     * Obtiene la configuración de nómina del tenant
     * Si no existe, crea una con valores por defecto
     */
    @Transactional
    public PayrollConfigurationDTO getConfiguration(Long customerId) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        PayrollConfiguration config = configRepository.findByCustomer(customer)
                .orElseGet(() -> {
                    log.info("Creating default payroll configuration for customer {}", customerId);
                    PayrollConfiguration defaultConfig = PayrollConfiguration.getDefault(customer);
                    return configRepository.save(defaultConfig);
                });

        return convertToDTO(config);
    }

    /**
     * Actualiza la configuración de nómina
     */
    @Transactional
    public PayrollConfigurationDTO updateConfiguration(Long customerId, PayrollConfigurationDTO dto) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        PayrollConfiguration config = configRepository.findByCustomer(customer)
                .orElseGet(() -> PayrollConfiguration.getDefault(customer));

        // Actualizar campos
        updateEntityFromDTO(config, dto);

        PayrollConfiguration saved = configRepository.save(config);
        log.info("Payroll configuration updated for customer {}", customerId);

        return convertToDTO(saved);
    }

    /**
     * Restaura la configuración a valores por defecto
     */
    @Transactional
    public PayrollConfigurationDTO resetConfiguration(Long customerId) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        configRepository.findByCustomer(customer).ifPresent(configRepository::delete);

        PayrollConfiguration defaultConfig = PayrollConfiguration.getDefault(customer);
        PayrollConfiguration saved = configRepository.save(defaultConfig);

        log.info("Payroll configuration reset to defaults for customer {}", customerId);
        return convertToDTO(saved);
    }

    private PayrollConfigurationDTO convertToDTO(PayrollConfiguration entity) {
        return PayrollConfigurationDTO.builder()
                .id(entity.getId())
                .customerId(entity.getCustomer().getId())
                // Prestaciones
                .aguinaldoDays(entity.getAguinaldoDays())
                .vacationDaysPerYear(entity.getVacationDaysPerYear())
                .vacationPremiumPercentage(entity.getVacationPremiumPercentage())
                // Impuestos
                .applyIsr(entity.getApplyIsr())
                .applyImss(entity.getApplyImss())
                .imssWorkerPercentage(entity.getImssWorkerPercentage())
                .imssEmployerPercentage(entity.getImssEmployerPercentage())
                // Salarios
                .minimumWage(entity.getMinimumWage())
                .umaValue(entity.getUmaValue())
                // Timbrado
                .enableCfdiTimbrado(entity.getEnableCfdiTimbrado())
                .pacProvider(entity.getPacProvider())
                .pacApiKey(entity.getPacApiKey() != null ? "********" : null) // Ocultar API key
                .pacApiUrl(entity.getPacApiUrl())
                // Banco
                .bankLayoutFormat(entity.getBankLayoutFormat())
                // Contabilidad
                .enableAccountingIntegration(entity.getEnableAccountingIntegration())
                .payrollExpenseAccount(entity.getPayrollExpenseAccount())
                .taxesPayableAccount(entity.getTaxesPayableAccount())
                .salariesPayableAccount(entity.getSalariesPayableAccount())
                // Notificaciones
                .sendReceiptsByEmail(entity.getSendReceiptsByEmail())
                .sendReceiptsByWhatsapp(entity.getSendReceiptsByWhatsapp())
                // Colombia defaults
                .healthPercentageEmployee(new BigDecimal("4.00"))
                .healthPercentageEmployer(new BigDecimal("8.50"))
                .pensionPercentageEmployee(new BigDecimal("4.00"))
                .pensionPercentageEmployer(new BigDecimal("12.00"))
                .solidarityFundPercentage(new BigDecimal("1.00"))
                .arlPercentage(new BigDecimal("0.522"))
                .transportAllowance(new BigDecimal("162000")) // 2024 Colombia
                .parafiscalCajaPercentage(new BigDecimal("4.00"))
                .parafiscalSenaPercentage(new BigDecimal("2.00"))
                .parafiscalIcbfPercentage(new BigDecimal("3.00"))
                .build();
    }

    private void updateEntityFromDTO(PayrollConfiguration entity, PayrollConfigurationDTO dto) {
        if (dto.getAguinaldoDays() != null)
            entity.setAguinaldoDays(dto.getAguinaldoDays());
        if (dto.getVacationDaysPerYear() != null)
            entity.setVacationDaysPerYear(dto.getVacationDaysPerYear());
        if (dto.getVacationPremiumPercentage() != null)
            entity.setVacationPremiumPercentage(dto.getVacationPremiumPercentage());
        if (dto.getApplyIsr() != null)
            entity.setApplyIsr(dto.getApplyIsr());
        if (dto.getApplyImss() != null)
            entity.setApplyImss(dto.getApplyImss());
        if (dto.getImssWorkerPercentage() != null)
            entity.setImssWorkerPercentage(dto.getImssWorkerPercentage());
        if (dto.getImssEmployerPercentage() != null)
            entity.setImssEmployerPercentage(dto.getImssEmployerPercentage());
        if (dto.getMinimumWage() != null)
            entity.setMinimumWage(dto.getMinimumWage());
        if (dto.getUmaValue() != null)
            entity.setUmaValue(dto.getUmaValue());
        if (dto.getEnableCfdiTimbrado() != null)
            entity.setEnableCfdiTimbrado(dto.getEnableCfdiTimbrado());
        if (dto.getPacProvider() != null)
            entity.setPacProvider(dto.getPacProvider());
        if (dto.getPacApiKey() != null && !dto.getPacApiKey().equals("********")) {
            entity.setPacApiKey(dto.getPacApiKey());
        }
        if (dto.getPacApiUrl() != null)
            entity.setPacApiUrl(dto.getPacApiUrl());
        if (dto.getBankLayoutFormat() != null)
            entity.setBankLayoutFormat(dto.getBankLayoutFormat());
        if (dto.getEnableAccountingIntegration() != null)
            entity.setEnableAccountingIntegration(dto.getEnableAccountingIntegration());
        if (dto.getPayrollExpenseAccount() != null)
            entity.setPayrollExpenseAccount(dto.getPayrollExpenseAccount());
        if (dto.getTaxesPayableAccount() != null)
            entity.setTaxesPayableAccount(dto.getTaxesPayableAccount());
        if (dto.getSalariesPayableAccount() != null)
            entity.setSalariesPayableAccount(dto.getSalariesPayableAccount());
        if (dto.getSendReceiptsByEmail() != null)
            entity.setSendReceiptsByEmail(dto.getSendReceiptsByEmail());
        if (dto.getSendReceiptsByWhatsapp() != null)
            entity.setSendReceiptsByWhatsapp(dto.getSendReceiptsByWhatsapp());
    }
}
