package com.app.starter1.persistence.repository;

import com.app.starter1.persistence.entity.Contact;
import com.app.starter1.persistence.entity.ContactType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ContactRepository extends JpaRepository<Contact, Long> {

    List<Contact> findByTenantId(Integer tenantId);

    List<Contact> findByTenantIdAndType(Integer tenantId, ContactType type);

    List<Contact> findByTenantIdAndNameContainingIgnoreCase(Integer tenantId, String name);

    List<Contact> findByTenantIdAndPhoneContaining(Integer tenantId, String phone);
}
