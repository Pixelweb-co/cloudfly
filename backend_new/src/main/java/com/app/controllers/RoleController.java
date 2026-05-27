package com.app.controllers;

import com.app.persistence.entity.RoleEntity;
import com.app.persistence.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

@Slf4j
@RestController
@RequestMapping("/roles")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class RoleController {

    private final RoleRepository roleRepository;

    @GetMapping
    public Flux<RoleEntity> getAllRoles() {
        log.info("🔍 [ROLE-CONTROLLER] GET /roles - Fetching all security roles");
        return roleRepository.findAll();
    }
}
