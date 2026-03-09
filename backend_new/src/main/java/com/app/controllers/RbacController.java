package com.app.controllers;

import com.app.dto.MenuItemDto;
import com.app.dto.UserPermissionsDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/rbac")
@RequiredArgsConstructor
@Slf4j
public class RbacController {

    @GetMapping("/my-permissions")
    public Mono<ResponseEntity<UserPermissionsDto>> getMyPermissions() {
        return ReactiveSecurityContextHolder.getContext()
                .map(SecurityContext::getAuthentication)
                .map(auth -> {
                    List<String> roles = auth.getAuthorities().stream()
                            .map(GrantedAuthority::getAuthority)
                            .map(a -> a.replace("ROLE_", ""))
                            .collect(Collectors.toList());

                    // Hardcoded menu and permissions for now to allow progress
                    // In a future step, this should be moved to a Service that uses the DB
                    List<MenuItemDto> menu = new ArrayList<>();
                    menu.add(MenuItemDto.builder()
                            .label("Dashboard")
                            .href("/home")
                            .icon("tabler-smart-home")
                            .build());

                    UserPermissionsDto permissionsDto = UserPermissionsDto.builder()
                            .username(auth.getName())
                            .roles(roles)
                            .permissions(Set.of("dashboard.view", "customers.view", "customers.create"))
                            .modules(List.of("DASHBOARD", "CUSTOMERS"))
                            .menu(menu)
                            .build();

                    return ResponseEntity.ok(permissionsDto);
                });
    }

    @GetMapping("/menu")
    public Mono<ResponseEntity<List<MenuItemDto>>> getMenu() {
        List<MenuItemDto> menu = new ArrayList<>();
        menu.add(MenuItemDto.builder()
                .label("Dashboard")
                .href("/home")
                .icon("tabler-smart-home")
                .build());

        return Mono.just(ResponseEntity.ok(menu));
    }
}
