package com.app.starter1.services;

import com.app.starter1.dto.hr.EmployeeCreateDTO;
import com.app.starter1.dto.hr.EmployeeDTO;
import com.app.starter1.dto.hr.EmployeePayrollHistoryDTO;
import com.app.starter1.persistence.entity.Employee;
import com.app.starter1.persistence.entity.Customer;
import com.app.starter1.persistence.entity.PayrollReceipt;
import com.app.starter1.persistence.entity.UserEntity;
import com.app.starter1.persistence.entity.RoleEntity;
import com.app.starter1.persistence.repository.CostCenterRepository;
import com.app.starter1.persistence.repository.EmployeeRepository;
import com.app.starter1.persistence.repository.CustomerRepository;
import com.app.starter1.persistence.repository.PayrollReceiptRepository;
import com.app.starter1.persistence.repository.UserRepository;
import com.app.starter1.persistence.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmployeeService {

        private final EmployeeRepository employeeRepository;
        private final CustomerRepository customerRepository;
        private final PayrollReceiptRepository payrollReceiptRepository;
        private final CostCenterRepository costCenterRepository;
        private final UserRepository userRepository;
        private final RoleRepository roleRepository;
        private final PasswordEncoder passwordEncoder;

        @Transactional(readOnly = true)
        public Page<EmployeeDTO> getAllEmployees(Long customerId, Pageable pageable) {
                Customer customer = customerRepository.findById(customerId)
                                .orElseThrow(() -> new RuntimeException("Customer not found"));
                log.info("Getting all employees for customer: {}", customer.getId());
                return employeeRepository.findByCustomerAndDeletedAtIsNull(customer, pageable)
                                .map(this::convertToDTO);
        }

        @Transactional(readOnly = true)
        public Page<EmployeeDTO> getActiveEmployees(Long customerId, Pageable pageable) {
                Customer customer = customerRepository.findById(customerId)
                                .orElseThrow(() -> new RuntimeException("Customer not found"));
                return employeeRepository.findByCustomerAndIsActiveTrueAndDeletedAtIsNull(customer, pageable)
                                .map(this::convertToDTO);
        }

        @Transactional(readOnly = true)
        public EmployeeDTO getEmployeeById(Long id, Long customerId) {
                Customer customer = customerRepository.findById(customerId)
                                .orElseThrow(() -> new RuntimeException("Customer not found"));
                Employee employee = employeeRepository.findByIdAndCustomer(id, customer)
                                .orElseThrow(() -> new RuntimeException("Employee not found"));
                return convertToDTO(employee);
        }

        @Transactional
        public EmployeeDTO createEmployee(EmployeeCreateDTO dto, Long customerId) {
                Customer customer = customerRepository.findById(customerId)
                                .orElseThrow(() -> new RuntimeException("Customer not found"));
                log.info("Creating employee: {} {}", dto.getFirstName(), dto.getLastName());

                // Verificar employeeNumber único
                if (dto.getEmployeeNumber() != null &&
                                employeeRepository.existsByEmployeeNumberAndCustomer(dto.getEmployeeNumber(),
                                                customer)) {
                        throw new RuntimeException("Employee number already exists");
                }

                // Manejar acceso al sistema
                UserEntity user = handleUserAccess(dto, customer);

                Employee employee = Employee.builder()
                                .customer(customer)
                                .user(user) // Vincular usuario si corresponde
                                .firstName(dto.getFirstName())
                                .lastName(dto.getLastName())
                                .rfc(dto.getRfc())
                                .curp(dto.getCurp())
                                .nationalId(dto.getNationalId())
                                .email(dto.getEmail())
                                .phone(dto.getPhone())
                                .address(dto.getAddress())
                                .city(dto.getCity())
                                .state(dto.getState())
                                .postalCode(dto.getPostalCode())
                                .birthDate(dto.getBirthDate())
                                .employeeNumber(dto.getEmployeeNumber())
                                .hireDate(dto.getHireDate())
                                .terminationDate(dto.getTerminationDate())
                                .department(dto.getDepartment())
                                .costCenter(dto.getCostCenterId() != null
                                                ? costCenterRepository.findById(dto.getCostCenterId()).orElse(null)
                                                : null)
                                .jobTitle(dto.getJobTitle())
                                .contractType(dto.getContractType())
                                .baseSalary(dto.getBaseSalary())
                                .paymentFrequency(Employee.PaymentFrequency.valueOf(dto.getPaymentFrequency()))
                                .paymentMethod(
                                                dto.getPaymentMethod() != null
                                                                ? Employee.PaymentMethod.valueOf(dto.getPaymentMethod())
                                                                : null)
                                .bankName(dto.getBankName())
                                .bankAccount(dto.getBankAccount())
                                .clabe(dto.getClabe())
                                // Campos Colombia
                                .nss(dto.getNss())
                                .eps(dto.getEps())
                                .arl(dto.getArl())
                                .afp(dto.getAfp())
                                .cesantiasBox(dto.getCesantiasBox())
                                .salaryType(
                                                dto.getSalaryType() != null
                                                                ? Employee.SalaryType.valueOf(dto.getSalaryType())
                                                                : Employee.SalaryType.ORDINARIO)
                                .hasTransportAllowance(
                                                dto.getHasTransportAllowance() != null ? dto.getHasTransportAllowance()
                                                                : true)
                                .hasFamilySubsidy(
                                                dto.getHasFamilySubsidy() != null ? dto.getHasFamilySubsidy()
                                                                : false)
                                .contractTypeEnum(
                                                dto.getContractTypeEnum() != null
                                                                ? Employee.ContractTypeEnum
                                                                                .valueOf(dto.getContractTypeEnum())
                                                                : null)
                                .isActive(dto.getIsActive() != null ? dto.getIsActive() : true)
                                .notes(dto.getNotes())
                                .build();

                employee = employeeRepository.save(employee);
                log.info("Employee created with ID: {}, User: {}", employee.getId(),
                                user != null ? user.getUsername() : "none");

                return convertToDTO(employee);
        }

        /**
         * Maneja las opciones de acceso al sistema para un empleado
         */
        private UserEntity handleUserAccess(EmployeeCreateDTO dto, Customer customer) {
                String accessOption = dto.getAccessOption() != null ? dto.getAccessOption() : "NONE";

                switch (accessOption.toUpperCase()) {
                        case "EXISTING":
                                // Vincular usuario existente
                                if (dto.getExistingUserId() == null) {
                                        throw new RuntimeException("Se requiere el ID del usuario existente");
                                }
                                UserEntity existingUser = userRepository.findById(dto.getExistingUserId())
                                                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con ID: "
                                                                + dto.getExistingUserId()));
                                log.info("Linking existing user: {}", existingUser.getUsername());
                                return existingUser;

                        case "CREATE_NEW":
                                // Crear nuevo usuario
                                return createNewUserForEmployee(dto, customer);

                        case "NONE":
                        default:
                                // Sin acceso al sistema
                                return null;
                }
        }

        /**
         * Crea un nuevo usuario del sistema para el empleado
         */
        private UserEntity createNewUserForEmployee(EmployeeCreateDTO dto, Customer customer) {
                // Validar campos requeridos
                if (dto.getNewUsername() == null || dto.getNewUsername().isBlank()) {
                        throw new RuntimeException("Se requiere el username para crear un nuevo usuario");
                }
                if (dto.getNewPassword() == null || dto.getNewPassword().isBlank()) {
                        throw new RuntimeException("Se requiere el password para crear un nuevo usuario");
                }

                // Verificar que el username no exista
                if (userRepository.existsByUsername(dto.getNewUsername())) {
                        throw new RuntimeException("El username ya existe: " + dto.getNewUsername());
                }

                // Verificar que el email no exista (si tiene email)
                String email = dto.getEmail() != null ? dto.getEmail()
                                : dto.getNewUsername() + "@" + customer.getId() + ".local";
                if (userRepository.existsByEmail(email)) {
                        throw new RuntimeException("El email ya está registrado: " + email);
                }

                // Obtener el rol
                String roleName = dto.getNewRole() != null ? dto.getNewRole().toUpperCase() : "USER";
                List<RoleEntity> roles = roleRepository.findRoleEntitiesByRoleEnumIn(List.of(roleName));
                if (roles.isEmpty()) {
                        throw new RuntimeException("Rol no encontrado: " + roleName);
                }

                // Crear el usuario
                UserEntity newUser = UserEntity.builder()
                                .nombres(dto.getFirstName())
                                .apellidos(dto.getLastName())
                                .username(dto.getNewUsername())
                                .password(passwordEncoder.encode(dto.getNewPassword()))
                                .email(email)
                                .isEnabled(true)
                                .accountNoExpired(true)
                                .accountNoLocked(true)
                                .credentialNoExpired(true)
                                .customer(customer)
                                .roles(new HashSet<>(roles))
                                .build();

                newUser = userRepository.save(newUser);
                log.info("Created new user for employee: {} with role: {}", newUser.getUsername(), roleName);

                // TODO: Enviar credenciales por email si dto.getSendCredentialsByEmail() es
                // true
                if (Boolean.TRUE.equals(dto.getSendCredentialsByEmail())) {
                        log.info("Should send credentials by email to: {}", email);
                        // Aquí se puede integrar con un servicio de email
                }

                return newUser;
        }

        @Transactional
        public EmployeeDTO updateEmployee(Long id, EmployeeCreateDTO dto, Long customerId) {
                Customer customer = customerRepository.findById(customerId)
                                .orElseThrow(() -> new RuntimeException("Customer not found"));
                Employee employee = employeeRepository.findByIdAndCustomer(id, customer)
                                .orElseThrow(() -> new RuntimeException("Employee not found"));

                employee.setFirstName(dto.getFirstName());
                employee.setLastName(dto.getLastName());
                employee.setRfc(dto.getRfc());
                employee.setCurp(dto.getCurp());
                employee.setNationalId(dto.getNationalId());
                employee.setEmail(dto.getEmail());
                employee.setPhone(dto.getPhone());
                employee.setAddress(dto.getAddress());
                employee.setCity(dto.getCity());
                employee.setState(dto.getState());
                employee.setPostalCode(dto.getPostalCode());
                employee.setBirthDate(dto.getBirthDate());
                employee.setHireDate(dto.getHireDate());
                employee.setTerminationDate(dto.getTerminationDate());
                employee.setDepartment(dto.getDepartment());
                // Actualizar centro de costo
                if (dto.getCostCenterId() != null) {
                        employee.setCostCenter(costCenterRepository.findById(dto.getCostCenterId()).orElse(null));
                } else {
                        employee.setCostCenter(null);
                }
                employee.setJobTitle(dto.getJobTitle());
                employee.setContractType(dto.getContractType());
                employee.setBaseSalary(dto.getBaseSalary());
                employee.setPaymentFrequency(Employee.PaymentFrequency.valueOf(dto.getPaymentFrequency()));
                if (dto.getPaymentMethod() != null) {
                        employee.setPaymentMethod(Employee.PaymentMethod.valueOf(dto.getPaymentMethod()));
                }
                employee.setBankName(dto.getBankName());
                employee.setBankAccount(dto.getBankAccount());
                employee.setClabe(dto.getClabe());
                // Campos Colombia
                employee.setNss(dto.getNss());
                employee.setEps(dto.getEps());
                employee.setArl(dto.getArl());
                employee.setAfp(dto.getAfp());
                employee.setCesantiasBox(dto.getCesantiasBox());
                if (dto.getSalaryType() != null) {
                        employee.setSalaryType(Employee.SalaryType.valueOf(dto.getSalaryType()));
                }
                if (dto.getHasTransportAllowance() != null) {
                        employee.setHasTransportAllowance(dto.getHasTransportAllowance());
                }
                if (dto.getHasFamilySubsidy() != null) {
                        employee.setHasFamilySubsidy(dto.getHasFamilySubsidy());
                }
                if (dto.getContractTypeEnum() != null) {
                        employee.setContractTypeEnum(Employee.ContractTypeEnum.valueOf(dto.getContractTypeEnum()));
                }
                employee.setNotes(dto.getNotes());

                employee = employeeRepository.save(employee);
                return convertToDTO(employee);
        }

        @Transactional
        public void deleteEmployee(Long id, Long customerId) {
                Customer customer = customerRepository.findById(customerId)
                                .orElseThrow(() -> new RuntimeException("Customer not found"));
                Employee employee = employeeRepository.findByIdAndCustomer(id, customer)
                                .orElseThrow(() -> new RuntimeException("Employee not found"));

                // Soft delete
                employee.setDeletedAt(LocalDateTime.now());
                employee.setIsActive(false);
                employeeRepository.save(employee);

                log.info("Employee soft deleted: {}", id);
        }

        @Transactional
        public void toggleEmployeeStatus(Long id, Long customerId) {
                Customer customer = customerRepository.findById(customerId)
                                .orElseThrow(() -> new RuntimeException("Customer not found"));
                Employee employee = employeeRepository.findByIdAndCustomer(id, customer)
                                .orElseThrow(() -> new RuntimeException("Employee not found"));

                employee.setIsActive(!employee.getIsActive());
                employeeRepository.save(employee);

                log.info("Employee status toggled: {} - Active: {}", id, employee.getIsActive());
        }

        @Transactional(readOnly = true)
        public Page<EmployeeDTO> searchEmployees(String search, Long customerId, Pageable pageable) {
                Customer customer = customerRepository.findById(customerId)
                                .orElseThrow(() -> new RuntimeException("Customer not found"));
                return employeeRepository.searchEmployees(customer, search, pageable)
                                .map(this::convertToDTO);
        }

        @Transactional(readOnly = true)
        public List<EmployeePayrollHistoryDTO> getEmployeePayrollHistory(Long employeeId, Long customerId) {
                Customer customer = customerRepository.findById(customerId)
                                .orElseThrow(() -> new RuntimeException("Customer not found"));
                Employee employee = employeeRepository.findByIdAndCustomer(employeeId, customer)
                                .orElseThrow(() -> new RuntimeException("Employee not found"));

                List<PayrollReceipt> receipts = payrollReceiptRepository.findByEmployee(employee);
                return receipts.stream()
                                .map(this::convertToPayrollHistoryDTO)
                                .collect(Collectors.toList());
        }

        /**
         * Obtiene usuarios del tenant que no tienen empleado asignado
         */
        @Transactional(readOnly = true)
        public List<com.app.starter1.controllers.EmployeeController.AvailableUserDTO> getAvailableUsers(
                        Long customerId) {
                Customer customer = customerRepository.findById(customerId)
                                .orElseThrow(() -> new RuntimeException("Customer not found"));

                // Obtener IDs de usuarios ya asignados a empleados
                List<Long> assignedUserIds = employeeRepository.findByCustomerAndDeletedAtIsNull(customer)
                                .stream()
                                .filter(e -> e.getUser() != null)
                                .map(e -> e.getUser().getId())
                                .collect(Collectors.toList());

                // Obtener todos los usuarios del tenant
                List<UserEntity> allUsers = new java.util.ArrayList<>();
                userRepository.findAll().forEach(user -> {
                        if (user.getCustomer() != null &&
                                        user.getCustomer().getId().equals(customer.getId()) &&
                                        !assignedUserIds.contains(user.getId())) {
                                allUsers.add(user);
                        }
                });

                return allUsers.stream()
                                .map(user -> {
                                        String role = user.getRoles() != null && !user.getRoles().isEmpty()
                                                        ? user.getRoles().stream().findFirst()
                                                                        .map(r -> r.getRoleEnum().name()).orElse(null)
                                                        : null;
                                        return new com.app.starter1.controllers.EmployeeController.AvailableUserDTO(
                                                        user.getId(),
                                                        user.getUsername(),
                                                        user.getEmail(),
                                                        user.getNombres(),
                                                        user.getApellidos(),
                                                        role);
                                })
                                .collect(Collectors.toList());
        }

        // Conversion methods
        private EmployeeDTO convertToDTO(Employee employee) {
                // Obtener información del usuario si existe
                UserEntity user = employee.getUser();
                String userRole = null;
                if (user != null && user.getRoles() != null && !user.getRoles().isEmpty()) {
                        userRole = user.getRoles().stream()
                                        .findFirst()
                                        .map(role -> role.getRoleEnum().name())
                                        .orElse(null);
                }

                return EmployeeDTO.builder()
                                .id(employee.getId())
                                .firstName(employee.getFirstName())
                                .lastName(employee.getLastName())
                                .fullName(employee.getFullName())
                                .rfc(employee.getRfc())
                                .curp(employee.getCurp())
                                .nationalId(employee.getNationalId())
                                .email(employee.getEmail())
                                .phone(employee.getPhone())
                                .address(employee.getAddress())
                                .city(employee.getCity())
                                .state(employee.getState())
                                .postalCode(employee.getPostalCode())
                                .birthDate(employee.getBirthDate())
                                .employeeNumber(employee.getEmployeeNumber())
                                .hireDate(employee.getHireDate())
                                .terminationDate(employee.getTerminationDate())
                                .department(employee.getDepartment())
                                .costCenterId(employee.getCostCenter() != null ? employee.getCostCenter().getId()
                                                : null)
                                .costCenterCode(employee.getCostCenter() != null ? employee.getCostCenter().getCode()
                                                : null)
                                .costCenterName(employee.getCostCenter() != null ? employee.getCostCenter().getName()
                                                : null)
                                .jobTitle(employee.getJobTitle())
                                .contractType(employee.getContractType())
                                .baseSalary(employee.getBaseSalary())
                                .paymentFrequency(employee.getPaymentFrequency() != null
                                                ? employee.getPaymentFrequency().name()
                                                : null)
                                .paymentMethod(employee.getPaymentMethod() != null ? employee.getPaymentMethod().name()
                                                : null)
                                .bankName(employee.getBankName())
                                .bankAccount(employee.getBankAccount())
                                .clabe(employee.getClabe())
                                // Campos Colombia
                                .nss(employee.getNss())
                                .eps(employee.getEps())
                                .arl(employee.getArl())
                                .afp(employee.getAfp())
                                .cesantiasBox(employee.getCesantiasBox())
                                .salaryType(employee.getSalaryType() != null
                                                ? employee.getSalaryType().name()
                                                : null)
                                .hasTransportAllowance(employee.getHasTransportAllowance())
                                .contractTypeEnum(employee.getContractTypeEnum() != null
                                                ? employee.getContractTypeEnum().name()
                                                : null)
                                .isActive(employee.getIsActive())
                                .notes(employee.getNotes())
                                // Información de usuario del sistema
                                .userId(user != null ? user.getId() : null)
                                .username(user != null ? user.getUsername() : null)
                                .userEmail(user != null ? user.getEmail() : null)
                                .userRole(userRole)
                                .hasSystemAccess(user != null)
                                .build();
        }

        private EmployeePayrollHistoryDTO convertToPayrollHistoryDTO(PayrollReceipt receipt) {
                return EmployeePayrollHistoryDTO.builder()
                                .id(receipt.getId())
                                .receiptNumber(receipt.getReceiptNumber())
                                .periodId(receipt.getPayrollPeriod().getId())
                                .periodName(receipt.getPayrollPeriod().getPeriodName())
                                .periodYear(receipt.getPayrollPeriod().getYear())
                                .periodNumber(receipt.getPayrollPeriod().getPeriodNumber())
                                .periodType(receipt.getPayrollPeriod().getPeriodType().name())
                                .calculationDate(receipt.getCalculationDate())
                                .baseSalary(receipt.getBaseSalary())
                                .totalPerceptions(receipt.getTotalPerceptions())
                                .totalDeductions(receipt.getTotalDeductions())
                                .netPay(receipt.getNetPay())
                                .status(receipt.getStatus().name())
                                .paidAt(receipt.getPaidAt())
                                .pdfPath(receipt.getPdfPath())
                                .build();
        }
}
