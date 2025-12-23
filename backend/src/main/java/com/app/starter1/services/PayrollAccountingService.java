package com.app.starter1.services;

import com.app.starter1.persistence.entity.*;
import com.app.starter1.persistence.repository.*;
import jakarta.persistence.EntityManager;
import jakarta.persistence.ParameterMode;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.StoredProcedureQuery;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PayrollAccountingService {

    private final AccountingVoucherRepository voucherRepository;
    private final ChartOfAccountRepository accountRepository;
    private final PayrollConfigurationRepository payrollConfigRepository;
    private final CustomerRepository customerRepository;

    @PersistenceContext
    private EntityManager entityManager;

    /**
     * Genera el comprobante contable de causación de nómina para un período
     * liquidado.
     * Utiliza un procedimiento almacenado en MySQL para mayor robustez y
     * eficiencia.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public AccountingVoucher generatePayrollLiquidationVoucher(PayrollPeriod period, List<PayrollReceipt> receipts) {
        log.info("Generando comprobante contable para período de nómina: {} via SP", period.getId());

        Customer customer = period.getCustomer();
        PayrollConfiguration config = payrollConfigRepository.findByCustomer(customer)
                .orElse(PayrollConfiguration.getDefault(customer));

        if (!Boolean.TRUE.equals(config.getEnableAccountingIntegration())) {
            log.info("Integración contable desactivada para el cliente {}", customer.getId());
            return null;
        }

        try {
            // Llamar al procedimiento almacenado
            StoredProcedureQuery query = entityManager.createStoredProcedureQuery("sp_generate_payroll_voucher");
            query.registerStoredProcedureParameter("p_period_id", Long.class, ParameterMode.IN);
            query.registerStoredProcedureParameter("p_tenant_id", Integer.class, ParameterMode.IN);
            query.registerStoredProcedureParameter("p_voucher_id", Long.class, ParameterMode.OUT);

            query.setParameter("p_period_id", period.getId());
            query.setParameter("p_tenant_id", customer.getId().intValue());

            query.execute();

            Long voucherId = (Long) query.getOutputParameterValue("p_voucher_id");

            if (voucherId != null && voucherId > 0) {
                log.info("Comprobante contable generado exitosamente via SP. ID: {}", voucherId);
                return voucherRepository.findById(voucherId).orElse(null);
            } else {
                log.warn(
                        "El procedimiento almacenado no generó comprobante (posiblemente no hay recibos o montos en 0)");
                return null;
            }

        } catch (Exception e) {
            log.error("Error ejecutando procedimiento almacenado de contabilidad: {}", e.getMessage(), e);

            // Fallback: intentar con lógica Java básica si el SP falla
            log.info("Intentando fallback con lógica Java...");
            return generateVoucherJavaFallback(period, receipts, customer);
        }
    }

    /**
     * Fallback en Java por si el SP falla (primera ejecución o error de sintaxis)
     */
    private AccountingVoucher generateVoucherJavaFallback(PayrollPeriod period, List<PayrollReceipt> receipts,
            Customer customer) {
        try {
            if (receipts == null || receipts.isEmpty()) {
                log.warn("No hay recibos para generar contabilidad");
                return null;
            }

            BigDecimal totalDebit = BigDecimal.ZERO;
            BigDecimal totalCredit = BigDecimal.ZERO;

            // Calcular totales
            for (PayrollReceipt r : receipts) {
                totalDebit = totalDebit
                        .add(r.getTotalPerceptions() != null ? r.getTotalPerceptions() : BigDecimal.ZERO);
                totalCredit = totalCredit.add(r.getNetPay() != null ? r.getNetPay() : BigDecimal.ZERO);
            }

            AccountingVoucher voucher = AccountingVoucher.builder()
                    .voucherType(AccountingVoucher.VoucherType.NOTA_CONTABLE)
                    .date(LocalDate.now())
                    .description("Causación Nómina " + period.getPeriodName() + " (Fallback)")
                    .reference("NOM-" + period.getId())
                    .tenantId(customer.getId().intValue())
                    .status(AccountingVoucher.VoucherStatus.DRAFT)
                    .totalDebit(totalDebit)
                    .totalCredit(totalCredit)
                    .entries(new ArrayList<>())
                    .build();

            // Crear entrada simplificada de gasto
            ChartOfAccount expenseAccount = findOrCreateAccount("510506", "Sueldos", "GASTO", "DEBITO");
            AccountingEntry debitEntry = AccountingEntry.builder()
                    .voucher(voucher)
                    .account(expenseAccount)
                    .description("Gasto Nómina (Consolidado)")
                    .debitAmount(totalDebit)
                    .creditAmount(BigDecimal.ZERO)
                    .build();
            voucher.getEntries().add(debitEntry);

            // Crear entrada simplificada de pasivo
            ChartOfAccount liabilityAccount = findOrCreateAccount("250501", "Salarios por Pagar", "PASIVO", "CREDITO");
            AccountingEntry creditEntry = AccountingEntry.builder()
                    .voucher(voucher)
                    .account(liabilityAccount)
                    .description("Salarios por Pagar (Consolidado)")
                    .debitAmount(BigDecimal.ZERO)
                    .creditAmount(totalCredit)
                    .build();
            voucher.getEntries().add(creditEntry);

            voucher.calculateTotals();
            return voucherRepository.save(voucher);

        } catch (Exception e) {
            log.error("Error en fallback Java: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Genera el comprobante de egreso para un pago individual de nómina.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public AccountingVoucher generatePaymentVoucher(PayrollReceipt receipt, String paymentMethod, String reference) {
        log.info("Generando comprobante de egreso para recibo: {}", receipt.getId());

        Customer customer = receipt.getPayrollPeriod().getCustomer();
        PayrollConfiguration config = payrollConfigRepository.findByCustomer(customer)
                .orElse(PayrollConfiguration.getDefault(customer));

        if (!Boolean.TRUE.equals(config.getEnableAccountingIntegration())) {
            return null;
        }

        AccountingVoucher voucher = AccountingVoucher.builder()
                .voucherType(AccountingVoucher.VoucherType.EGRESO)
                .date(LocalDate.now())
                .description("Pago Nómina " + receipt.getEmployee().getFirstName() + " "
                        + receipt.getEmployee().getLastName())
                .reference(reference)
                .tenantId(customer.getId().intValue())
                .status(AccountingVoucher.VoucherStatus.DRAFT)
                .entries(new ArrayList<>())
                .build();

        // 1. Debit Pasivo (Salarios por Pagar)
        String salariesPayableAccount = config.getSalariesPayableAccount() != null
                && !config.getSalariesPayableAccount().isEmpty()
                        ? config.getSalariesPayableAccount()
                        : "250501";

        BigDecimal amount = receipt.getNetPay();
        addIndividualEntry(voucher, salariesPayableAccount, amount, true, "Pago Salarios por Pagar");

        // 2. Credit Banco/Caja
        String bankAccount = "111005"; // Default Banco Nacional
        if ("CASH".equalsIgnoreCase(paymentMethod)) {
            bankAccount = "110505"; // Caja General
        }
        addIndividualEntry(voucher, bankAccount, amount, false, "Salida de Dinero (" + paymentMethod + ")");

        voucher.calculateTotals();

        if (!voucher.getEntries().isEmpty()) {
            return voucherRepository.save(voucher);
        }

        return null;
    }

    private void addIndividualEntry(AccountingVoucher voucher, String accountCode, BigDecimal amount, boolean isDebit,
            String description) {
        ChartOfAccount account = findOrCreateAccount(accountCode, "Cuenta " + accountCode,
                isDebit ? "GASTO" : "PASIVO", isDebit ? "DEBITO" : "CREDITO");

        AccountingEntry entry = AccountingEntry.builder()
                .voucher(voucher)
                .account(account)
                .description(description)
                .debitAmount(isDebit ? amount : BigDecimal.ZERO)
                .creditAmount(!isDebit ? amount : BigDecimal.ZERO)
                .build();
        voucher.getEntries().add(entry);
    }

    /**
     * Busca una cuenta contable por código, y si no existe, la crea.
     */
    private ChartOfAccount findOrCreateAccount(String code, String name, String type, String nature) {
        return accountRepository.findByCode(code).orElseGet(() -> {
            log.warn("Cuenta {} no encontrada. Creándola automáticamente.", code);

            ChartOfAccount newAccount = new ChartOfAccount();
            newAccount.setCode(code);
            newAccount.setName(name);
            newAccount.setAccountType(type);
            newAccount.setNature(nature);
            newAccount.setIsActive(true);
            newAccount.setLevel(code.length());

            return accountRepository.save(newAccount);
        });
    }
}
