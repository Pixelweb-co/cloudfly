package com.app.starter1.persistence.repository;

import com.app.starter1.persistence.entity.Contact;
import com.app.starter1.persistence.entity.ContactType;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ContactRepository extends JpaRepository<Contact, Long> {

    List<Contact> findByTenantId(Integer tenantId);

    List<Contact> findByTenantIdAndType(Integer tenantId, ContactType type);

    List<Contact> findByTenantIdAndNameContainingIgnoreCase(Integer tenantId, String name);

    List<Contact> findByTenantIdAndPhoneContaining(Integer tenantId, String phone);

    @Query("SELECT c FROM Contact c WHERE c.tenantId = :tenantId AND (" +
           "LOWER(c.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "c.phone LIKE CONCAT('%', :query, '%') OR " +
           "c.documentNumber LIKE CONCAT('%', :query, '%'))")
    List<Contact> searchContacts(@Param("tenantId") Integer tenantId, @Param("query") String query);
}
