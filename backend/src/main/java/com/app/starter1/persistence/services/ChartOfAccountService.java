package com.app.starter1.persistence.services;

import com.app.starter1.persistence.entity.ChartOfAccount;
import com.app.starter1.persistence.repository.ChartOfAccountRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChartOfAccountService {

    private final ChartOfAccountRepository repository;

    @Transactional(readOnly = true)
    public List<ChartOfAccount> getAllAccounts() {
        log.info("Fetching all chart of accounts");
        return repository.findAll();
    }

    @Transactional(readOnly = true)
    public ChartOfAccount getAccountById(Long id) {
        log.info("Fetching account by id: {}", id);
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Account not found with id: " + id));
    }

    @Transactional(readOnly = true)
    public ChartOfAccount getAccountByCode(String code) {
        log.info("Fetching account by code: {}", code);
        return repository.findByCode(code)
                .orElseThrow(() -> new RuntimeException("Account not found with code: " + code));
    }

    @Transactional(readOnly = true)
    public List<ChartOfAccount> getAccountsByType(String accountType) {
        log.info("Fetching accounts by type: {}", accountType);
        return repository.findByAccountType(accountType);
    }

    @Transactional(readOnly = true)
    public List<ChartOfAccount> getAccountsByLevel(Integer level) {
        log.info("Fetching accounts by level: {}", level);
        return repository.findByLevel(level);
    }

    @Transactional(readOnly = true)
    public List<ChartOfAccount> getActiveAccounts() {
        log.info("Fetching active accounts");
        return repository.findByIsActiveTrue();
    }

    @Transactional
    public ChartOfAccount createAccount(ChartOfAccount account) {
        log.info("Creating new account with code: {}", account.getCode());

        if (repository.existsByCode(account.getCode())) {
            throw new RuntimeException("Account with code " + account.getCode() + " already exists");
        }

        return repository.save(account);
    }

    @Transactional
    public ChartOfAccount updateAccount(Long id, ChartOfAccount accountDetails) {
        log.info("Updating account with id: {}", id);

        ChartOfAccount account = getAccountById(id);

        if (account.getIsSystem()) {
            throw new RuntimeException("Cannot update system account");
        }

        account.setName(accountDetails.getName());
        account.setAccountType(accountDetails.getAccountType());
        account.setLevel(accountDetails.getLevel());
        account.setParentCode(accountDetails.getParentCode());
        account.setNature(accountDetails.getNature());
        account.setRequiresThirdParty(accountDetails.getRequiresThirdParty());
        account.setRequiresCostCenter(accountDetails.getRequiresCostCenter());
        account.setIsActive(accountDetails.getIsActive());

        return repository.save(account);
    }

    @Transactional
    public void deleteAccount(Long id) {
        log.info("Deleting account with id: {}", id);

        ChartOfAccount account = getAccountById(id);

        if (account.getIsSystem()) {
            throw new RuntimeException("Cannot delete system account");
        }

        repository.delete(account);
    }
}
