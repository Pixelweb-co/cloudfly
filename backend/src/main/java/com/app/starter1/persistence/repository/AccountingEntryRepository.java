package com.app.starter1.persistence.repository;

import com.app.starter1.persistence.entity.AccountingEntry;
import com.app.starter1.persistence.entity.AccountingVoucher;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

/**
 * Repository para AccountingEntry
 */
@Repository
public interface AccountingEntryRepository extends JpaRepository<AccountingEntry, Long> {

        /**
         * Encuentra movimientos por cuenta y rango de fechas
         */
        @Query("SELECT e FROM AccountingEntry e " +
                        "WHERE e.account.code = :accountCode " +
                        "AND e.voucher.date BETWEEN :fromDate AND :toDate " +
                        "AND e.voucher.status = :status " +
                        "ORDER BY e.voucher.date ASC, e.voucher.id ASC, e.lineNumber ASC")
        List<AccountingEntry> findByAccountCodeAndVoucherDateBetweenAndVoucherStatusOrderByVoucherDateAscVoucherIdAsc(
                        @Param("accountCode") String accountCode,
                        @Param("fromDate") LocalDate fromDate,
                        @Param("toDate") LocalDate toDate,
                        @Param("status") AccountingVoucher.VoucherStatus status);

        /**
         * Encuentra movimientos anteriores a una fecha (para saldo inicial)
         */
        @Query("SELECT e FROM AccountingEntry e " +
                        "WHERE e.account.code = :accountCode " +
                        "AND e.voucher.date < :beforeDate " +
                        "AND e.voucher.status = :status " +
                        "ORDER BY e.voucher.date ASC, e.voucher.id ASC")
        List<AccountingEntry> findByAccountCodeAndVoucherDateBeforeAndVoucherStatusOrderByVoucherDateAsc(
                        @Param("accountCode") String accountCode,
                        @Param("beforeDate") LocalDate beforeDate,
                        @Param("status") AccountingVoucher.VoucherStatus status);

        /**
         * Suma total de débitos y créditos por cuenta
         */
        @Query("SELECT " +
                        "COALESCE(SUM(e.debitAmount), 0), " +
                        "COALESCE(SUM(e.creditAmount), 0) " +
                        "FROM AccountingEntry e " +
                        "WHERE e.account.code = :accountCode " +
                        "AND e.voucher.status = :status")
        Object[] sumDebitAndCreditByAccountCode(
                        @Param("accountCode") String accountCode,
                        @Param("status") AccountingVoucher.VoucherStatus status);

        /**
         * Encuentra entradas por ID de comprobante
         */
        List<AccountingEntry> findByVoucherIdOrderByLineNumber(Long voucherId);

        /**
         * Elimina entradas por ID de comprobante
         */
        void deleteByVoucherId(Long voucherId);
}
