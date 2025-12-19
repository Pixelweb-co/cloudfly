package com.app.starter1.controllers;

import com.app.starter1.dto.hr.EmployeeCreateDTO;
import com.app.starter1.dto.hr.EmployeeDTO;
import com.app.starter1.services.EmployeeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/hr/employees")
@RequiredArgsConstructor
public class EmployeeController {

    private final EmployeeService employeeService;

    @GetMapping
    public ResponseEntity<Page<EmployeeDTO>> getAllEmployees(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "false") boolean activeOnly,
            @RequestParam Long customerId) {

        Pageable pageable = PageRequest.of(page, size);

        Page<EmployeeDTO> employees;
        if (search != null && !search.isEmpty()) {
            employees = employeeService.searchEmployees(search, customerId, pageable);
        } else if (activeOnly) {
            employees = employeeService.getActiveEmployees(customerId, pageable);
        } else {
            employees = employeeService.getAllEmployees(customerId, pageable);
        }

        return ResponseEntity.ok(employees);
    }

    @GetMapping("/{id}")
    public ResponseEntity<EmployeeDTO> getEmployeeById(
            @PathVariable Long id,
            @RequestParam Long customerId) {
        EmployeeDTO employee = employeeService.getEmployeeById(id, customerId);
        return ResponseEntity.ok(employee);
    }

    @PostMapping
    public ResponseEntity<EmployeeDTO> createEmployee(
            @Valid @RequestBody EmployeeCreateDTO dto,
            @RequestParam Long customerId) {
        EmployeeDTO created = employeeService.createEmployee(dto, customerId);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<EmployeeDTO> updateEmployee(
            @PathVariable Long id,
            @Valid @RequestBody EmployeeCreateDTO dto,
            @RequestParam Long customerId) {
        EmployeeDTO updated = employeeService.updateEmployee(id, dto, customerId);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEmployee(
            @PathVariable Long id,
            @RequestParam Long customerId) {
        employeeService.deleteEmployee(id, customerId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/toggle-status")
    public ResponseEntity<Void> toggleEmployeeStatus(
            @PathVariable Long id,
            @RequestParam Long customerId) {
        employeeService.toggleEmployeeStatus(id, customerId);
        return ResponseEntity.ok().build();
    }
}
