package com.app.starter1.persistence.services;

import com.app.starter1.dto.ContactRequestDTO;
import com.app.starter1.dto.ContactResponseDTO;
import com.app.starter1.persistence.entity.Contact;
import com.app.starter1.persistence.entity.ContactType;
import com.app.starter1.persistence.repository.ContactRepository;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ContactService {

    private final ContactRepository contactRepository;

    public ContactService(ContactRepository contactRepository) {
        this.contactRepository = contactRepository;
    }

    @Transactional
    public ContactResponseDTO create(ContactRequestDTO request) {
        Contact contact = new Contact();
        BeanUtils.copyProperties(request, contact);

        Contact savedContact = contactRepository.save(contact);
        return mapToDTO(savedContact);
    }

    public List<ContactResponseDTO> getAllByTenant(Integer tenantId) {
        return contactRepository.findByTenantId(tenantId).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public List<ContactResponseDTO> searchByName(Integer tenantId, String name) {
        return contactRepository.findByTenantIdAndNameContainingIgnoreCase(tenantId, name).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public List<ContactResponseDTO> searchByPhone(Integer tenantId, String phone) {
        return contactRepository.findByTenantIdAndPhoneContaining(tenantId, phone).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public List<ContactResponseDTO> getByType(Integer tenantId, ContactType type) {
        return contactRepository.findByTenantIdAndType(tenantId, type).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public ContactResponseDTO getById(Long id) {
        Contact contact = contactRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Contact not found"));
        return mapToDTO(contact);
    }

    private ContactResponseDTO mapToDTO(Contact contact) {
        ContactResponseDTO dto = new ContactResponseDTO();
        BeanUtils.copyProperties(contact, dto);
        return dto;
    }
}
