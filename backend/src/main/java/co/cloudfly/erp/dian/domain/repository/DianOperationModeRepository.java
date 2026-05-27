package co.cloudfly.erp.dian.domain.repository;

import co.cloudfly.erp.dian.domain.entity.DianOperationMode;
import co.cloudfly.erp.dian.domain.enums.DianDocumentType;
import co.cloudfly.erp.dian.domain.enums.DianEnvironment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DianOperationModeRepository extends JpaRepository<DianOperationMode, Long> {

    /**
     * Busca todos los modos de operación de un tenant
     */
    List<DianOperationMode> findByTenantId(Long tenantId);

    /**
     * Busca modos de operación por tenant y compañía
     */
    List<DianOperationMode> findByTenantIdAndCompanyId(Long tenantId, Long companyId);

    /**
     * Busca el modo activo para una combinación específica
     */
    Optional<DianOperationMode> findByTenantIdAndCompanyIdAndDocumentTypeAndEnvironmentAndActiveTrue(
            Long tenantId,
            Long companyId,
            DianDocumentType documentType,
            DianEnvironment environment);

    /**
     * Verifica si existe un modo activo (distinto al ID dado) para la combinación
     */
    @Query("SELECT COUNT(m) > 0 FROM DianOperationMode m " +
            "WHERE m.tenantId = :tenantId " +
            "AND m.companyId = :companyId " +
            "AND m.documentType = :documentType " +
            "AND m.environment = :environment " +
            "AND m.active = true " +
            "AND (:excludeId IS NULL OR m.id != :excludeId)")
    boolean existsActiveMode(
            @Param("tenantId") Long tenantId,
            @Param("companyId") Long companyId,
            @Param("documentType") DianDocumentType documentType,
            @Param("environment") DianEnvironment environment,
            @Param("excludeId") Long excludeId);

    /**
     * Busca modos por tipo de documento
     */
    List<DianOperationMode> findByTenantIdAndDocumentType(Long tenantId, DianDocumentType documentType);

    /**
     * Busca modos activos de un tenant
     */
    List<DianOperationMode> findByTenantIdAndActiveTrue(Long tenantId);
}
