package com.app.starter1.controllers;

import com.app.starter1.persistence.entity.ChartOfAccount;
import com.app.starter1.persistence.services.ChartOfAccountService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/chart-of-accounts")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasAnyRole('SUPERADMIN', 'ADMIN', 'CONTADOR')")
public class ChartOfAccountController {

    private final ChartOfAccountService service;

    @GetMapping
    public ResponseEntity<List<ChartOfAccount>> getAllAccounts() {
        log.info("GET /chart-of-accounts - Fetching all accounts");
        return ResponseEntity.ok(service.getAllAccounts());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ChartOfAccount> getAccountById(@PathVariable Long id) {
        log.info("GET /chart-of-accounts/{} - Fetching account by ID", id);
        return ResponseEntity.ok(service.getAccountById(id));
    }

    @GetMapping("/code/{code}")
    public ResponseEntity<ChartOfAccount> getAccountByCode(@PathVariable String code) {
        log.info("GET /chart-of-accounts/code/{} - Fetching account by code", code);
        return ResponseEntity.ok(service.getAccountByCode(code));
    }

    @GetMapping("/type/{accountType}")
    public ResponseEntity<List<ChartOfAccount>> getAccountsByType(@PathVariable String accountType) {
        log.info("GET /chart-of-accounts/type/{} - Fetching accounts by type", accountType);
        return ResponseEntity.ok(service.getAccountsByType(accountType));
    }

    @GetMapping("/level/{level}")
    public ResponseEntity<List<ChartOfAccount>> getAccountsByLevel(@PathVariable Integer level) {
        log.info("GET /chart-of-accounts/level/{} - Fetching accounts by level", level);
        return ResponseEntity.ok(service.getAccountsByLevel(level));
    }

    @GetMapping("/active")
    public ResponseEntity<List<ChartOfAccount>> getActiveAccounts() {
        log.info("GET /chart-of-accounts/active - Fetching active accounts");
        return ResponseEntity.ok(service.getActiveAccounts());
    }

    @PostMapping
    public ResponseEntity<ChartOfAccount> createAccount(@RequestBody ChartOfAccount account) {
        log.info("POST /chart-of-accounts - Creating new account: {}", account.getCode());
        ChartOfAccount created = service.createAccount(account);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ChartOfAccount> updateAccount(
            @PathVariable Long id,
            @RequestBody ChartOfAccount accountDetails) {
        log.info("PUT /chart-of-accounts/{} - Updating account", id);
        return ResponseEntity.ok(service.updateAccount(id, accountDetails));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAccount(@PathVariable Long id) {
        log.info("DELETE /chart-of-accounts/{} - Deleting account", id);
        service.deleteAccount(id);
        return ResponseEntity.noContent().build();
    }
}
