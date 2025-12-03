package com.app.starter1.controllers;

import com.app.starter1.dto.ContactRequestDTO;
import com.app.starter1.dto.ContactResponseDTO;
import com.app.starter1.persistence.entity.ContactType;
import com.app.starter1.persistence.services.ContactService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/contacts")
public class ContactController {

    private final ContactService contactService;

    public ContactController(ContactService contactService) {
        this.contactService = contactService;
    }

    @PostMapping
    public ResponseEntity<ContactResponseDTO> create(@Valid @RequestBody ContactRequestDTO request) {
        return ResponseEntity.ok(contactService.create(request));
    }

    @GetMapping("/tenant/{tenantId}")
    public ResponseEntity<List<ContactResponseDTO>> getAllByTenant(@PathVariable Integer tenantId) {
        return ResponseEntity.ok(contactService.getAllByTenant(tenantId));
    }

    @GetMapping("/search")
    public ResponseEntity<List<ContactResponseDTO>> search(
            @RequestParam Integer tenantId,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String phone) {

        if (name != null && !name.isEmpty()) {
            return ResponseEntity.ok(contactService.searchByName(tenantId, name));
        }
        if (phone != null && !phone.isEmpty()) {
            return ResponseEntity.ok(contactService.searchByPhone(tenantId, phone));
        }
        return ResponseEntity.ok(contactService.getAllByTenant(tenantId));
    }

    @GetMapping("/tenant/{tenantId}/type/{type}")
    public ResponseEntity<List<ContactResponseDTO>> getByType(
            @PathVariable Integer tenantId,
            @PathVariable ContactType type) {
        return ResponseEntity.ok(contactService.getByType(tenantId, type));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ContactResponseDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(contactService.getById(id));
    }
}
