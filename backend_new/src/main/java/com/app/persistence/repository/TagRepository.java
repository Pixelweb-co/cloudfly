package com.app.persistence.repository;

import com.app.persistence.entity.TagEntity;
import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface TagRepository extends ReactiveCrudRepository<TagEntity, Long> {

    @Query("SELECT * FROM tags WHERE tenant_id = :tenantId AND company_id = :companyId")
    Flux<TagEntity> findByTenantIdAndCompanyId(Long tenantId, Long companyId);

    @Query("SELECT * FROM tags WHERE tenant_id = :tenantId AND company_id = :companyId AND name = :name")
    Mono<TagEntity> findByTenantIdAndCompanyIdAndName(Long tenantId, Long companyId, String name);

    @Query("SELECT t.* FROM tags t INNER JOIN contact_tags ct ON t.id = ct.tag_id WHERE ct.contact_id = :contactId")
    Flux<TagEntity> findTagsByContactId(Long contactId);

    @Modifying
    @Query("INSERT INTO contact_tags (contact_id, tag_id) VALUES (:contactId, :tagId)")
    Mono<Void> associateTag(Long contactId, Long tagId);

    @Modifying
    @Query("DELETE FROM contact_tags WHERE contact_id = :contactId AND tag_id = :tagId")
    Mono<Void> disassociateTag(Long contactId, Long tagId);

    @Modifying
    @Query("DELETE FROM contact_tags WHERE contact_id = :contactId")
    Mono<Void> clearContactTags(Long contactId);

    @Query("SELECT COUNT(*) FROM contact_tags WHERE contact_id = :contactId AND tag_id = :tagId")
    Mono<Integer> isTagAssociated(Long contactId, Long tagId);
}
