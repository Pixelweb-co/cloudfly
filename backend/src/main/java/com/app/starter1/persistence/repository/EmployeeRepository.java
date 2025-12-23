package com.app.starter1.persistence.repository;

import com.app.starter1.persistence.entity.Employee;
import com.app.starter1.persistence.entity.Customer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {

        // Buscar empleados activos por customer (sin soft delete)
        List<Employee> findByCustomerAndIsActiveTrueAndDeletedAtIsNull(Customer customer);

        // Buscar empleado por ID y customer
        Optional<Employee> findByIdAndCustomer(Long id, Customer customer);

        // Buscar empleado por número de empleado y customer
        Optional<Employee> findByEmployeeNumberAndCustomer(String employeeNumber, Customer customer);

        // Buscar empleados por customer con paginación
        Page<Employee> findByCustomerAndDeletedAtIsNull(Customer customer, Pageable pageable);

        // Buscar empleados activos por customer con paginación
        Page<Employee> findByCustomerAndIsActiveTrueAndDeletedAtIsNull(Customer customer, Pageable pageable);

        // Búsqueda por nombre
        @Query("SELECT e FROM Employee e WHERE e.customer = :customer AND e.deletedAt IS NULL AND " +
                        "(LOWER(e.firstName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
                        "LOWER(e.lastName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
                        "LOWER(e.employeeNumber) LIKE LOWER(CONCAT('%', :search, '%')))")
        Page<Employee> searchEmployees(@Param("customer") Customer customer,
                        @Param("search") String search,
                        Pageable pageable);

        // Buscar empleados por departamento
        List<Employee> findByCustomerAndDepartmentAndIsActiveTrueAndDeletedAtIsNull(
                        Customer customer, String department);

        // Contar empleados activos
        long countByCustomerAndIsActiveTrueAndDeletedAtIsNull(Customer customer);

        // Verificar si existe un número de empleado
        boolean existsByEmployeeNumberAndCustomer(String employeeNumber, Customer customer);

        // Buscar empleados con fecha de terminación nula (activos)
        List<Employee> findByCustomerAndTerminationDateIsNullAndDeletedAtIsNull(Customer customer);

        // Buscar todos los empleados por customer (sin paginación) - para obtener
        // usuarios asignados
        List<Employee> findByCustomerAndDeletedAtIsNull(Customer customer);
}
