package co.cloudfly.erp.dian.domain.repository;

import co.cloudfly.erp.dian.domain.entity.DianResolution;
import co.cloudfly.erp.dian.domain.enums.DianDocumentType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface DianResolutionRepository extends JpaRepository<DianResolution, Long> {

    /**
     * Busca todas las resoluciones de un tenant
     */
    List<DianResolution> findByTenantId(Long tenantId);

    /**
     * Busca resoluciones por tenant y compañía
     */
    List<DianResolution> findByTenantIdAndCompanyId(Long tenantId, Long companyId);

    /**
     * Busca la resolución activa para un tipo de documento y prefijo
     */
    Optional<DianResolution> findByTenantIdAndCompanyIdAndDocumentTypeAndPrefixAndActiveTrue(
            Long tenantId,
            Long companyId,
            DianDocumentType documentType,
            String prefix);

    /**
     * Verifica si existe una resolución activa (distinta al ID dado)
     */
    @Query("SELECT COUNT(r) > 0 FROM DianResolution r " +
            "WHERE r.tenantId = :tenantId " +
            "AND r.companyId = :companyId " +
            "AND r.documentType = :documentType " +
            "AND r.prefix = :prefix " +
            "AND r.active = true " +
            "AND (:excludeId IS NULL OR r.id != :excludeId)")
    boolean existsActiveResolution(
            @Param("tenantId") Long tenantId,
            @Param("companyId") Long companyId,
            @Param("documentType") DianDocumentType documentType,
            @Param("prefix") String prefix,
            @Param("excludeId") Long excludeId);

    /**
     * Verifica si hay superposición de rangos
     */
    @Query("SELECT COUNT(r) > 0 FROM DianResolution r " +
            "WHERE r.tenantId = :tenantId " +
            "AND r.companyId = :companyId " +
            "AND r.documentType = :documentType " +
            "AND r.prefix = :prefix " +
            "AND r.active = true " +
            "AND (:excludeId IS NULL OR r.id != :excludeId) " +
            "AND ((r.numberRangeFrom <= :rangeFrom AND r.numberRangeTo >= :rangeFrom) " +
            "     OR (r.numberRangeFrom <= :rangeTo AND r.numberRangeTo >= :rangeTo) " +
            "     OR (r.numberRangeFrom >= :rangeFrom AND r.numberRangeTo <= :rangeTo))")
    boolean hasRangeOverlap(
            @Param("tenantId") Long tenantId,
            @Param("companyId") Long companyId,
            @Param("documentType") DianDocumentType documentType,
            @Param("prefix") String prefix,
            @Param("rangeFrom") Long rangeFrom,
            @Param("rangeTo") Long rangeTo,
            @Param("excludeId") Long excludeId);

    /**
     * Busca resoluciones vigentes
     */
    @Query("SELECT r FROM DianResolution r " +
            "WHERE r.tenantId = :tenantId " +
            "AND r.companyId = :companyId " +
            "AND r.active = true " +
            "AND r.validFrom <= :now " +
            "AND r.validTo >= :now")
    List<DianResolution> findValidResolutions(
            @Param("tenantId") Long tenantId,
            @Param("companyId") Long companyId,
            @Param("now") LocalDate now);

    /**
     * Busca resoluciones por tipo de documento
     */
    List<DianResolution> findByTenantIdAndCompanyIdAndDocumentType(
            Long tenantId,
            Long companyId,
            DianDocumentType documentType);
}
