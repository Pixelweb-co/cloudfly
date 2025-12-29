package co.cloudfly.erp.dian.domain.repository;

import co.cloudfly.erp.dian.domain.entity.DianCertificate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface DianCertificateRepository extends JpaRepository<DianCertificate, Long> {

    /**
     * Busca todos los certificados de un tenant
     */
    List<DianCertificate> findByTenantId(Long tenantId);

    /**
     * Busca certificados por tenant y compañía
     */
    List<DianCertificate> findByTenantIdAndCompanyId(Long tenantId, Long companyId);

    /**
     * Busca el certificado activo de una compañía
     */
    Optional<DianCertificate> findByTenantIdAndCompanyIdAndActiveTrue(Long tenantId, Long companyId);

    /**
     * Verifica si existe un certificado activo (distinto al ID dado)
     */
    @Query("SELECT COUNT(c) > 0 FROM DianCertificate c " +
            "WHERE c.tenantId = :tenantId " +
            "AND c.companyId = :companyId " +
            "AND c.active = true " +
            "AND (:excludeId IS NULL OR c.id != :excludeId)")
    boolean existsActiveCertificate(
            @Param("tenantId") Long tenantId,
            @Param("companyId") Long companyId,
            @Param("excludeId") Long excludeId);

    /**
     * Busca certificados vigentes (válidos en la fecha actual)
     */
    @Query("SELECT c FROM DianCertificate c " +
            "WHERE c.tenantId = :tenantId " +
            "AND c.companyId = :companyId " +
            "AND c.active = true " +
            "AND c.validFrom <= :now " +
            "AND c.validTo >= :now")
    List<DianCertificate> findValidCertificates(
            @Param("tenantId") Long tenantId,
            @Param("companyId") Long companyId,
            @Param("now") LocalDateTime now);

    /**
     * Busca certificados que expiran pronto
     */
    @Query("SELECT c FROM DianCertificate c " +
            "WHERE c.tenantId = :tenantId " +
            "AND c.active = true " +
            "AND c.validTo BETWEEN :now AND :expirationDate")
    List<DianCertificate> findCertificatesExpiringBetween(
            @Param("tenantId") Long tenantId,
            @Param("now") LocalDateTime now,
            @Param("expirationDate") LocalDateTime expirationDate);
}
