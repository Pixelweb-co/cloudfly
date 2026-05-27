package co.cloudfly.dian.core.domain.repository;

import co.cloudfly.dian.common.enums.ElectronicDocumentStatus;
import co.cloudfly.dian.common.enums.ElectronicDocumentType;
import co.cloudfly.dian.core.domain.entity.ElectronicDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ElectronicDocumentRepository extends JpaRepository<ElectronicDocument, Long> {

    Optional<ElectronicDocument> findByEventId(String eventId);

    Optional<ElectronicDocument> findByTenantIdAndCompanyIdAndSourceDocumentId(
            Long tenantId, Long companyId, String sourceDocumentId);

    List<ElectronicDocument> findByTenantIdAndCompanyId(Long tenantId, Long companyId);

    List<ElectronicDocument> findByTenantIdAndCompanyIdAndStatus(
            Long tenantId, Long companyId, ElectronicDocumentStatus status);

    List<ElectronicDocument> findByTenantIdAndCompanyIdAndDocumentType(
            Long tenantId, Long companyId, ElectronicDocumentType documentType);

    boolean existsByEventId(String eventId);
}
