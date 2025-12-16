package com.app.starter1.services;

import com.app.starter1.dto.accounting.VoucherEntryDTO;
import com.app.starter1.dto.accounting.VoucherRequestDTO;
import com.app.starter1.dto.accounting.VoucherResponseDTO;
import com.app.starter1.persistence.entity.AccountingEntry;
import com.app.starter1.persistence.entity.AccountingVoucher;
import com.app.starter1.persistence.entity.ChartOfAccount;
import com.app.starter1.persistence.entity.Contact;
import com.app.starter1.persistence.entity.CostCenter;
import com.app.starter1.persistence.repository.AccountingEntryRepository;
import com.app.starter1.persistence.repository.AccountingVoucherRepository;
import com.app.starter1.persistence.repository.ChartOfAccountRepository;
import com.app.starter1.persistence.repository.CostCenterRepository;
import com.app.starter1.persistence.repository.ContactRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AccountingVoucherService {

    private final AccountingVoucherRepository voucherRepository;
    private final AccountingEntryRepository entryRepository;
    private final ChartOfAccountRepository accountRepository;
    private final CostCenterRepository costCenterRepository;
    private final ContactRepository contactRepository;

    @Transactional(readOnly = true)
    public List<VoucherResponseDTO> getAllVouchers(Integer tenantId) {
        log.info("Fetching all vouchers for tenant: {}", tenantId);
        List<AccountingVoucher> vouchers = voucherRepository.findByTenantIdOrderByDateDescIdDesc(tenantId);
        return vouchers.stream().map(this::toResponseDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public VoucherResponseDTO getVoucherById(Long id) {
        log.info("Fetching voucher by id: {}", id);
        AccountingVoucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Comprobante no encontrado: " + id));
        return toResponseDTO(voucher);
    }

    @Transactional
    public VoucherResponseDTO createVoucher(VoucherRequestDTO request) {
        log.info("Creating voucher type: {}", request.getVoucherType());

        // Generar número consecutivo
        String voucherNumber = generateVoucherNumber(
                AccountingVoucher.VoucherType.valueOf(request.getVoucherType()),
                request.getTenantId());

        // Calcular totales
        BigDecimal totalDebit = request.getEntries().stream()
                .map(VoucherEntryDTO::getDebitAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalCredit = request.getEntries().stream()
                .map(VoucherEntryDTO::getCreditAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Crear comprobante
        AccountingVoucher voucher = AccountingVoucher.builder()
                .voucherType(AccountingVoucher.VoucherType.valueOf(request.getVoucherType()))
                .voucherNumber(voucherNumber)
                .date(request.getDate())
                .description(request.getDescription())
                .reference(request.getReference())
                .status(AccountingVoucher.VoucherStatus.DRAFT)
                .tenantId(request.getTenantId())
                .totalDebit(totalDebit)
                .totalCredit(totalCredit)
                .fiscalYear(request.getDate().getYear())
                .fiscalPeriod(request.getDate().getMonthValue())
                .build();

        voucher = voucherRepository.save(voucher);

        // Crear entradas
        List<AccountingEntry> entries = new ArrayList<>();
        int lineNumber = 1;
        for (VoucherEntryDTO entryDTO : request.getEntries()) {
            // Buscar cuenta
            ChartOfAccount account = accountRepository.findByCode(entryDTO.getAccountCode())
                    .orElseThrow(
                            () -> new IllegalArgumentException("Cuenta no encontrada: " + entryDTO.getAccountCode()));

            // Buscar tercero si existe
            Contact thirdParty = null;
            if (entryDTO.getThirdPartyId() != null) {
                thirdParty = contactRepository.findById(entryDTO.getThirdPartyId()).orElse(null);
            }

            // Buscar centro de costo si existe
            CostCenter costCenter = null;
            if (entryDTO.getCostCenterId() != null) {
                costCenter = costCenterRepository.findById(entryDTO.getCostCenterId()).orElse(null);
            }

            AccountingEntry entry = AccountingEntry.builder()
                    .voucher(voucher)
                    .lineNumber(lineNumber++)
                    .account(account)
                    .thirdParty(thirdParty)
                    .costCenter(costCenter)
                    .description(entryDTO.getDescription())
                    .debitAmount(entryDTO.getDebitAmount())
                    .creditAmount(entryDTO.getCreditAmount())
                    .baseValue(entryDTO.getBaseValue())
                    .taxValue(entryDTO.getTaxValue())
                    .build();
            entries.add(entry);
        }
        entryRepository.saveAll(entries);

        log.info("Voucher created: {} - {}", voucherNumber, voucher.getId());
        return getVoucherById(voucher.getId());
    }

    @Transactional
    public VoucherResponseDTO updateVoucher(Long id, VoucherRequestDTO request) {
        log.info("Updating voucher: {}", id);

        AccountingVoucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Comprobante no encontrado: " + id));

        if (voucher.getStatus() != AccountingVoucher.VoucherStatus.DRAFT) {
            throw new IllegalArgumentException("Solo se pueden editar comprobantes en borrador");
        }

        // Calcular totales
        BigDecimal totalDebit = request.getEntries().stream()
                .map(VoucherEntryDTO::getDebitAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalCredit = request.getEntries().stream()
                .map(VoucherEntryDTO::getCreditAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Actualizar comprobante
        voucher.setDate(request.getDate());
        voucher.setDescription(request.getDescription());
        voucher.setReference(request.getReference());
        voucher.setTotalDebit(totalDebit);
        voucher.setTotalCredit(totalCredit);
        voucher.setFiscalYear(request.getDate().getYear());
        voucher.setFiscalPeriod(request.getDate().getMonthValue());

        voucherRepository.save(voucher);

        // Eliminar entradas antiguas y crear nuevas
        entryRepository.deleteByVoucherId(voucher.getId());

        List<AccountingEntry> entries = new ArrayList<>();
        int lineNumber = 1;
        for (VoucherEntryDTO entryDTO : request.getEntries()) {
            // Buscar cuenta
            ChartOfAccount account = accountRepository.findByCode(entryDTO.getAccountCode())
                    .orElseThrow(
                            () -> new IllegalArgumentException("Cuenta no encontrada: " + entryDTO.getAccountCode()));

            // Buscar tercero si existe
            Contact thirdParty = null;
            if (entryDTO.getThirdPartyId() != null) {
                thirdParty = contactRepository.findById(entryDTO.getThirdPartyId()).orElse(null);
            }

            // Buscar centro de costo si existe
            CostCenter costCenter = null;
            if (entryDTO.getCostCenterId() != null) {
                costCenter = costCenterRepository.findById(entryDTO.getCostCenterId()).orElse(null);
            }

            AccountingEntry entry = AccountingEntry.builder()
                    .voucher(voucher)
                    .lineNumber(lineNumber++)
                    .account(account)
                    .thirdParty(thirdParty)
                    .costCenter(costCenter)
                    .description(entryDTO.getDescription())
                    .debitAmount(entryDTO.getDebitAmount())
                    .creditAmount(entryDTO.getCreditAmount())
                    .baseValue(entryDTO.getBaseValue())
                    .taxValue(entryDTO.getTaxValue())
                    .build();
            entries.add(entry);
        }
        entryRepository.saveAll(entries);

        log.info("Voucher updated: {}", id);
        return getVoucherById(id);
    }

    @Transactional
    public void deleteVoucher(Long id) {
        log.info("Deleting voucher: {}", id);
        AccountingVoucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Comprobante no encontrado: " + id));

        if (voucher.getStatus() != AccountingVoucher.VoucherStatus.DRAFT) {
            throw new IllegalArgumentException("Solo se pueden eliminar comprobantes en borrador");
        }

        entryRepository.deleteByVoucherId(id);
        voucherRepository.deleteById(id);
        log.info("Voucher deleted: {}", id);
    }

    @Transactional
    public VoucherResponseDTO postVoucher(Long id) {
        log.info("Posting voucher: {}", id);
        AccountingVoucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Comprobante no encontrado: " + id));

        if (voucher.getStatus() != AccountingVoucher.VoucherStatus.DRAFT) {
            throw new IllegalArgumentException("El comprobante ya está contabilizado");
        }

        // Validar que esté balanceado
        if (voucher.getTotalDebit().compareTo(voucher.getTotalCredit()) != 0) {
            throw new IllegalArgumentException("El comprobante no está balanceado");
        }

        voucher.setStatus(AccountingVoucher.VoucherStatus.POSTED);
        voucher.setPostedAt(LocalDateTime.now());
        voucherRepository.save(voucher);

        log.info("Voucher posted: {}", id);
        return getVoucherById(id);
    }

    @Transactional
    public VoucherResponseDTO voidVoucher(Long id) {
        log.info("Voiding voucher: {}", id);
        AccountingVoucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Comprobante no encontrado: " + id));

        if (voucher.getStatus() != AccountingVoucher.VoucherStatus.POSTED) {
            throw new IllegalArgumentException("Solo se pueden anular comprobantes contabilizados");
        }

        voucher.setStatus(AccountingVoucher.VoucherStatus.VOID);
        voucherRepository.save(voucher);

        log.info("Voucher voided: {}", id);
        return getVoucherById(id);
    }

    private String generateVoucherNumber(AccountingVoucher.VoucherType type, Integer tenantId) {
        String lastNumber = voucherRepository.findLastVoucherNumber(type, tenantId);

        int nextNumber = 1;
        if (lastNumber != null) {
            String[] parts = lastNumber.split("-");
            if (parts.length > 1) {
                nextNumber = Integer.parseInt(parts[1]) + 1;
            }
        }

        String prefix = type.name().substring(0, 3); // ING, EGR, NOT
        return String.format("%s-%04d", prefix, nextNumber);
    }

    private VoucherResponseDTO toResponseDTO(AccountingVoucher voucher) {
        List<AccountingEntry> entries = entryRepository.findByVoucherIdOrderByLineNumber(voucher.getId());

        List<VoucherEntryDTO> entryDTOs = entries.stream().map(entry -> {
            VoucherEntryDTO dto = VoucherEntryDTO.builder()
                    .id(entry.getId())
                    .lineNumber(entry.getLineNumber())
                    .accountCode(entry.getAccount() != null ? entry.getAccount().getCode() : null)
                    .accountName(entry.getAccount() != null ? entry.getAccount().getName() : null)
                    .thirdPartyId(entry.getThirdParty() != null ? entry.getThirdParty().getId() : null)
                    .thirdPartyName(entry.getThirdParty() != null ? entry.getThirdParty().getName() : null)
                    .costCenterId(entry.getCostCenter() != null ? entry.getCostCenter().getId() : null)
                    .costCenterName(entry.getCostCenter() != null ? entry.getCostCenter().getName() : null)
                    .description(entry.getDescription())
                    .debitAmount(entry.getDebitAmount())
                    .creditAmount(entry.getCreditAmount())
                    .baseValue(entry.getBaseValue())
                    .taxValue(entry.getTaxValue())
                    .build();

            return dto;
        }).collect(Collectors.toList());

        return VoucherResponseDTO.builder()
                .id(voucher.getId())
                .voucherType(voucher.getVoucherType().name())
                .voucherNumber(voucher.getVoucherNumber())
                .date(voucher.getDate())
                .description(voucher.getDescription())
                .reference(voucher.getReference())
                .status(voucher.getStatus().name())
                .tenantId(voucher.getTenantId())
                .totalDebit(voucher.getTotalDebit())
                .totalCredit(voucher.getTotalCredit())
                .isBalanced(voucher.getTotalDebit().compareTo(voucher.getTotalCredit()) == 0)
                .fiscalYear(voucher.getFiscalYear())
                .fiscalPeriod(voucher.getFiscalPeriod())
                .createdAt(voucher.getCreatedAt())
                .postedAt(voucher.getPostedAt())
                .entries(entryDTOs)
                .build();
    }
}
