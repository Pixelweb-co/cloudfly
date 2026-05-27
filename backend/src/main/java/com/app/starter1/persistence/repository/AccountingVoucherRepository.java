package com.app.starter1.persistence.repository;

import com.app.starter1.persistence.entity.AccountingVoucher;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

/**
 * Repository para AccountingVoucher
 */
@Repository
public interface AccountingVoucherRepository extends JpaRepository<AccountingVoucher, Long> {

        /**
         * Encuentra comprobantes por tenant y rango de fechas, ordenados
         * cronológicamente
         */
        List<AccountingVoucher> findByTenantIdAndDateBetweenAndStatusOrderByDateAscVoucherNumberAsc(
                        Integer tenantId,
                        LocalDate fromDate,
                        LocalDate toDate,
                        AccountingVoucher.VoucherStatus status);

        /**
         * Encuentra comprobantes por tenant, rango de fechas y tipo, ordenados
         * cronológicamente
         */
        List<AccountingVoucher> findByTenantIdAndDateBetweenAndVoucherTypeAndStatusOrderByDateAscVoucherNumberAsc(
                        Integer tenantId,
                        LocalDate fromDate,
                        LocalDate toDate,
                        AccountingVoucher.VoucherType voucherType,
                        AccountingVoucher.VoucherStatus status);

        /**
         * Encuentra comprobantes por tenant y estado
         */
        List<AccountingVoucher> findByTenantIdAndStatus(
                        Integer tenantId,
                        AccountingVoucher.VoucherStatus status);

        /**
         * Encuentra comprobantes por tipo y tenant
         */
        List<AccountingVoucher> findByTenantIdAndVoucherType(
                        Integer tenantId,
                        AccountingVoucher.VoucherType voucherType);

        /**
         * Cuenta comprobantes por tipo y tenant
         */
        Long countByTenantIdAndVoucherType(
                        Integer tenantId,
                        AccountingVoucher.VoucherType voucherType);

        /**
         * Encuentra todos los comprobantes por tenant ordenados por fecha descendente
         */
        List<AccountingVoucher> findByTenantIdOrderByDateDescIdDesc(Integer tenantId);

        /**
         * Encuentra el último número de comprobante por tipo y tenant
         */
        @Query("SELECT v.voucherNumber FROM AccountingVoucher v " +
                        "WHERE v.voucherType = :type AND v.tenantId = :tenantId " +
                        "ORDER BY v.id DESC LIMIT 1")
        String findLastVoucherNumber(
                        @Param("type") AccountingVoucher.VoucherType type,
                        @Param("tenantId") Integer tenantId);
}
