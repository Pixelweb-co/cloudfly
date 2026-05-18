package com.app.controllers;

import com.app.dto.AccountSetupRequest;
import com.app.dto.CustomerDto;
import com.app.persistence.entity.*;
import com.app.persistence.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.app.dto.UserDto;
import com.app.persistence.services.UserService;
import com.app.persistence.services.EvolutionService;
import com.app.persistence.repository.ChannelConfigRepository;
import com.app.persistence.entity.ChannelConfig;
import com.app.persistence.entity.ChannelType;
import com.app.persistence.services.ChannelConfigService;
import com.app.persistence.services.TenantService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import org.springframework.kafka.core.reactive.ReactiveKafkaProducerTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/customers")
@RequiredArgsConstructor
@Slf4j
public class CustomerController {

    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final PlanRepository planRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final SubscriptionModuleRepository subscriptionModuleRepository;
    private final PlanModuleRepository planModuleRepository;
    private final UserService userService;
    private final CompanyRepository companyRepository;
    private final ReactiveKafkaProducerTemplate<String, Object> kafkaTemplate;
    private final EvolutionService evolutionService;
    private final ChannelConfigRepository channelConfigRepository;
    private final ChannelConfigService channelConfigService;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final com.app.persistence.services.OnboardingDefaultsService onboardingDefaultsService;
    private final TenantService tenantService;
    private final ContactRepository contactRepository;
    private final PaymentMethodRepository paymentMethodRepository;


    @GetMapping
    public Flux<CustomerDto> getAllCustomers() {
        log.info("GET /customers - Fetching all customers");
        return tenantRepository.findAll()
                .map(this::toDto);
    }

    @GetMapping("/{id}")
    public Mono<ResponseEntity<CustomerDto>> getCustomerById(@PathVariable Long id) {
        log.info("GET /customers/{} - Fetching customer", id);
        return tenantRepository.findById(id)
                .map(this::toDto)
                .map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @GetMapping("/validate/nit")
    public Mono<ResponseEntity<Map<String, Object>>> validateNit(@RequestParam String nit) {
        return tenantRepository.findByNit(nit)
                .next()
                .map(t -> ResponseEntity.ok(Map.of("exists", (Object)true, "message", "El NIT ya está registrado")))
                .defaultIfEmpty(ResponseEntity.ok(Map.of("exists", false)));
    }

    @GetMapping("/validate/whatsapp")
    public Mono<ResponseEntity<Map<String, Object>>> validateWhatsApp(@RequestParam String number) {
        log.info("🔍 Validating WhatsApp for number: {}", number);
        // Usamos una instancia maestra o por defecto para validar
        return evolutionService.isOnWhatsApp("cloudfly_t1_c1", number)
                .map(exists -> ResponseEntity.ok(Map.of("exists", (Object)exists, "message", exists ? "WhatsApp válido" : "El número no tiene WhatsApp activo")))
                .onErrorResume(e -> Mono.just(ResponseEntity.ok(Map.of("exists", false, "error", e.getMessage()))));
    }

    @GetMapping("/validate/email")
    public Mono<ResponseEntity<Map<String, Object>>> validateEmail(@RequestParam String email) {
        boolean isPublic = email.contains("@gmail.com") || email.contains("@hotmail.com") || email.contains("@outlook.com") || email.contains("@yahoo.");
        return tenantRepository.findByEmail(email)
                .next() // <--- Fix: Toma el primero para evitar errores si hay duplicados por pruebas
                .map(t -> ResponseEntity.ok(Map.of("exists", (Object)true, "isCorporate", !isPublic, "message", "El email ya está en uso")))
                .defaultIfEmpty(ResponseEntity.ok(Map.of("exists", false, "isCorporate", !isPublic)));
    }

    private CustomerDto toDto(TenantEntity t) {
        return CustomerDto.builder()
                .id(t.getId())
                .name(t.getName())
                .nit(t.getNit())
                .phone(t.getPhone())
                .email(t.getEmail())
                .address(t.getAddress())
                .contact(t.getContact())
                .position(t.getPosition())
                .type(t.getType())
                .status(t.getStatus())
                .businessType(t.getBusinessType())
                .businessDescription(t.getBusinessDescription())
                .build();
    }

    @PostMapping("/account-setup")
    public Mono<ResponseEntity<UserDto>> accountSetup(@RequestBody AccountSetupRequest request) {
        log.info("🚀 [ACCOUNT-SETUP] Account setup request for user: {}", request.getUserId());

        return userRepository.findById(request.getUserId())
                .flatMap(user -> {
                    AccountSetupRequest.ClienteForm form = request.getForm();
                    log.info("📂 [ACCOUNT-SETUP] Processing Tenant: {}", form.getName());

                    // Si el usuario ya tiene un customerId, lo usamos para el TenantEntity para que sea un UPDATE
                    // Si es NULL, R2DBC hará un INSERT.
                    TenantEntity tenant = TenantEntity.builder()
                            .id(user.getCustomerId()) 
                            .name(form.getName())
                            .nit(form.getNit())
                            .phone(form.getPhone())
                            .email(form.getEmail())
                            .address(form.getAddress())
                            .contact(form.getContact())
                            .position(form.getPosition())
                            .type(form.getType() != null ? form.getType() : "Juridica")
                            .status(form.getStatus() != null ? Boolean.parseBoolean(form.getStatus()) : true)
                            .businessType(form.getBusinessType())
                            .businessDescription(form.getObjetoSocial())
                            .adminUserId(request.getUserId()) // <--- AQUÍ: Asociamos el usuario admin
                            .isMasterTenant(true)
                            .esEmisorFE(false)
                            .esEmisorPrincipal(true)
                            .createdAt(user.getCustomerId() == null ? LocalDateTime.now() : null)
                            .updatedAt(LocalDateTime.now())
                            .build();

                    return tenantRepository.save(tenant)
                            .doOnNext(st -> log.info("✅ [ACCOUNT-SETUP] Tenant saved with ID: {}", st.getId()))
                            .flatMap(savedTenant -> {
                                log.info("🏢 [ACCOUNT-SETUP] Saving Company for Tenant: {}", savedTenant.getId());
                                CompanyEntity company = CompanyEntity.builder()
                                        .tenantId(savedTenant.getId())
                                        .name(savedTenant.getName())
                                        .nit(savedTenant.getNit())
                                        .address(savedTenant.getAddress())
                                        .phone(savedTenant.getPhone())
                                        .email(savedTenant.getEmail())
                                        .contact(savedTenant.getContact())
                                        .position(savedTenant.getPosition())
                                        .status(true)
                                        .isPrincipal(true)
                                        .createdAt(LocalDateTime.now())
                                        .updatedAt(LocalDateTime.now())
                                        .build();

                                return companyRepository.save(company)
                                        .doOnNext(sc -> log.info("✅ [ACCOUNT-SETUP] Company saved with ID: {}", sc.getId()))
                                        .flatMap(savedCompany -> {
                                            user.setCustomerId(savedTenant.getId());
                                            log.info("👤 [ACCOUNT-SETUP] Linking User to Customer ID: {}", savedTenant.getId());

                                            // Crear el contacto principal inicial
                                            ContactEntity mainContact = ContactEntity.builder()
                                                    .tenantId(savedTenant.getId())
                                                    .companyId(savedCompany.getId())
                                                    .name(savedTenant.getContact())
                                                    .email(savedTenant.getEmail())
                                                    .phone(savedTenant.getPhone())
                                                    .position(savedTenant.getPosition())
                                                    .isEmployee(form.getIsEmployee() != null ? form.getIsEmployee() : true)
                                                    .isActive(true)
                                                    .createdAt(LocalDateTime.now())
                                                    .updatedAt(LocalDateTime.now())
                                                    .build();

                                            return contactRepository.save(mainContact)
                                                .doOnNext(smc -> log.info("✅ [ACCOUNT-SETUP] Main Contact created"))
                                                .flatMap(smc -> {
                                                    // Actualizar usuario con los IDs del Onboarding y timestamps
                                                    user.setCustomerId(savedTenant.getId());
                                                    user.setCompanyId(savedCompany.getId());
                                                    user.setContactId(smc.getId()); // Enlazar el contacto creado
                                                    user.setUpdatedAt(LocalDateTime.now());
                                                    if (user.getCreatedAt() == null) {
                                                        user.setCreatedAt(LocalDateTime.now());
                                                    }
                                                    
                                                    log.info("👤 [ACCOUNT-SETUP] Linking User {} to Tenant {}, Company {} and Contact {}", 
                                                            user.getId(), savedTenant.getId(), savedCompany.getId(), smc.getId());
                                                    
                                                    return userRepository.save(user);
                                                })
                                                .doOnNext(su -> log.info("✅ [ACCOUNT-SETUP] User updated successfully with IDs and Timestamps"))
                                                .flatMap(savedUser -> userService.convertToDto(savedUser));
                                        });
                            });
                })
                .map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    /**
     * PASO 4: Guardar método de pago + Crear suscripción Trial (Plan ID 2)
     */
    @PostMapping("/account-setup/payment")
    public Mono<ResponseEntity<Map<String, Object>>> accountSetupPayment(@RequestBody Map<String, Object> request) {
        Long tenantId = Long.valueOf(request.get("tenantId").toString());
        Long userId = Long.valueOf(request.get("userId").toString());
        String wompiToken = (String) request.getOrDefault("wompiToken", "");
        String brand = (String) request.getOrDefault("brand", "VISA");
        String last4 = (String) request.getOrDefault("last4", "0000");
        Integer expMonth = request.get("expMonth") != null ? Integer.valueOf(request.get("expMonth").toString()) : 12;
        Integer expYear = request.get("expYear") != null ? Integer.valueOf(request.get("expYear").toString()) : 2028;
        String billingCycle = (String) request.getOrDefault("billingCycle", "MONTHLY");

        log.info("💳 [PASO-4] Payment setup for Tenant: {}, User: {}, Cycle: {}", tenantId, userId, billingCycle);

        // 1. Guardar método de pago
        PaymentMethodEntity pm = PaymentMethodEntity.builder()
                .tenantId(tenantId)
                .provider("WOMPI")
                .token(wompiToken)
                .brand(brand)
                .last4(last4)
                .expMonth(expMonth)
                .expYear(expYear)
                .isDefault(true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        return paymentMethodRepository.save(pm)
                .doOnNext(saved -> log.info("✅ [PASO-4] PaymentMethod saved ID: {}", saved.getId()))
                .flatMap(savedPm -> {
                    // 2. Crear suscripción Trial con Plan ID 2
                    return planRepository.findById(2L)
                            .switchIfEmpty(Mono.error(new RuntimeException("Plan ID 2 no encontrado")))
                            .flatMap(plan -> {
                                BigDecimal basePrice = plan.getPrice() != null ? plan.getPrice() : new BigDecimal("99000");
                                BigDecimal finalPrice = basePrice;

                                if ("SEMIANNUAL".equals(billingCycle)) {
                                    BigDecimal discount = plan.getSemiannualDiscount() != null ? plan.getSemiannualDiscount() : new BigDecimal("0.03");
                                    finalPrice = basePrice.multiply(BigDecimal.ONE.subtract(discount));
                                } else if ("ANNUAL".equals(billingCycle)) {
                                    BigDecimal discount = plan.getAnnualDiscount() != null ? plan.getAnnualDiscount() : new BigDecimal("0.05");
                                    finalPrice = basePrice.multiply(BigDecimal.ONE.subtract(discount));
                                }

                                int trialDays = plan.getDurationDays() != null ? plan.getDurationDays() : 14;

                                SubscriptionEntity sub = SubscriptionEntity.builder()
                                        .planId(plan.getId())
                                        .customerId(tenantId)
                                        .userId(userId)
                                        .status("TRIAL")
                                        .billingCycle(billingCycle.toUpperCase())
                                        .startDate(LocalDateTime.now())
                                        .endDate(LocalDateTime.now().plusDays(trialDays))
                                        .trialEndsAt(LocalDateTime.now().plusDays(trialDays))
                                        .nextBillingDate(LocalDateTime.now().plusDays(trialDays))
                                        .isAutoRenew(true)
                                        .usersLimit(plan.getUsersLimit())
                                        .aiTokensLimit(plan.getAiTokensLimit())
                                        .monthlyPrice(finalPrice)
                                        .createdAt(LocalDateTime.now())
                                        .updatedAt(LocalDateTime.now())
                                        .build();

                                return subscriptionRepository.save(sub)
                                        .doOnNext(s -> log.info("✅ [PASO-4] Subscription Trial created ID: {}", s.getId()))
                                        .flatMap(savedSub ->
                                                planModuleRepository.findByPlanId(plan.getId())
                                                        .flatMap(mod -> subscriptionModuleRepository.insertModule(savedSub.getId(), mod.getModuleId()))
                                                        .then(Mono.just(savedSub))
                                        );
                            });
                })
                .map(savedSub -> ResponseEntity.ok(Map.<String, Object>of(
                        "status", true,
                        "subscriptionId", savedSub.getId(),
                        "message", "Trial activado correctamente"
                )))
                .onErrorResume(e -> {
                    log.error("🛑 [PASO-4] Payment setup failed: {}", e.getMessage());
                    return Mono.just(ResponseEntity.status(500).body(Map.of("status", (Object)false, "message", (Object)e.getMessage())));
                });
    }

    @DeleteMapping("/{id}/full")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN', 'SUPERADMIN')")
    public Mono<ResponseEntity<Void>> deleteTenantFull(@PathVariable Long id) {
        log.info("🗑️ [DELETE-TENANT] Request to purge tenant: {}", id);
        return tenantService.deleteTenantFull(id)
                .then(Mono.just(ResponseEntity.noContent().<Void>build()));
    }
    
    @DeleteMapping("/purge-all-except-master")
    @PreAuthorize("hasRole('MANAGER')")
    public Mono<ResponseEntity<String>> purgeAllExceptMaster() {
        log.info("💣 [PURGE] Executing purge of all tenants except master (ID 1)");
        return tenantRepository.findAll()
                .filter(tenant -> tenant.getId() != 1L)
                .flatMap(tenant -> {
                    log.info("   - Purging tenant: {} ({})", tenant.getName(), tenant.getId());
                    return tenantService.deleteTenantFull(tenant.getId())
                            .onErrorResume(e -> {
                                log.error("      ❌ Failed to purge tenant {}: {}", tenant.getId(), e.getMessage());
                                return Mono.empty();
                            });
                })
                .collectList()
                .map(list -> ResponseEntity.ok("Purge completed. " + list.size() + " tenants removed."));
    }

    private Mono<Void> createDefaultCategory(Long tenantId) {
        Category defaultCategory = Category.builder()
                .categoryName("General")
                .description("Categoría por defecto")
                .status(true)
                .tenantId(tenantId)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        log.info("📂 [ACCOUNT-SETUP] Saving Default Category for tenant: {}", tenantId);
        return categoryRepository.save(defaultCategory).then();
    }

    private Mono<Void> handleAutomaticSubscription(Long customerId, String cycle) {
        log.info("🔍 [ACCOUNT-SETUP] Searching for Free Plan... Billing Cycle: {}", cycle);
        String billingCycle = (cycle != null && !cycle.isEmpty()) ? cycle.toUpperCase() : "MONTHLY";
        
        return planRepository.findByIsFreeTrue()
                .next()
                .switchIfEmpty(Mono.error(new RuntimeException("Error: No se encontró ningún Plan Gratuito configurado.")))
                .flatMap(freePlan -> {
                    log.info("✅ [ACCOUNT-SETUP] Found Free Plan: {}. Activating for Customer: {} with cycle: {}", freePlan.getName(), customerId, billingCycle);
                    
                    // Lógica de precios según ciclo (Precio base definido en el Plan)
                    BigDecimal basePrice = freePlan.getPrice() != null ? freePlan.getPrice() : new BigDecimal("99000");
                    BigDecimal finalMonthlyPrice = basePrice;
                    
                    BigDecimal semiannualDiscount = freePlan.getSemiannualDiscount() != null ? freePlan.getSemiannualDiscount() : new BigDecimal("0.03");
                    BigDecimal annualDiscount = freePlan.getAnnualDiscount() != null ? freePlan.getAnnualDiscount() : new BigDecimal("0.05");
                    
                    if ("SEMIANNUAL".equals(billingCycle)) {
                        BigDecimal multiplier = BigDecimal.ONE.subtract(semiannualDiscount);
                        finalMonthlyPrice = basePrice.multiply(multiplier); 
                    } else if ("ANNUAL".equals(billingCycle)) {
                        BigDecimal multiplier = BigDecimal.ONE.subtract(annualDiscount);
                        finalMonthlyPrice = basePrice.multiply(multiplier);
                    }

                    SubscriptionEntity subscription = SubscriptionEntity.builder()
                            .planId(freePlan.getId())
                            .customerId(customerId)
                            .status("ACTIVE")
                            .billingCycle(billingCycle)
                            .startDate(LocalDateTime.now())
                            .endDate(LocalDateTime.now().plusDays(freePlan.getDurationDays() != null ? freePlan.getDurationDays() : 14))
                            .usersLimit(freePlan.getUsersLimit())
                            .aiTokensLimit(freePlan.getAiTokensLimit())
                            .monthlyPrice(finalMonthlyPrice) // Guardamos el precio que tendrá después del trial
                            .createdAt(LocalDateTime.now())
                            .updatedAt(LocalDateTime.now())
                            .build();

                    return subscriptionRepository.save(subscription)
                            .doOnNext(savedSub -> log.info("✅ [ACCOUNT-SETUP] Subscription created with ID: {}", savedSub.getId()))
                            .flatMap(savedSub -> {
                                return planModuleRepository.findByPlanId(freePlan.getId())
                                    .collectList()
                                    .doOnNext(modules -> log.info("🔗 [ACCOUNT-SETUP] Linking {} modules from Plan {} to Subscription {}", 
                                        modules.size(), freePlan.getName(), savedSub.getId()))
                                    .flatMapMany(Flux::fromIterable)
                                    .flatMap(pm -> {
                                        log.info("   - Module ID: {}", pm.getModuleId());
                                        return subscriptionModuleRepository.insertModule(savedSub.getId(), pm.getModuleId());
                                    })
                                    .then();
                            });
                })
                .doOnError(e -> log.error("🛑 [ACCOUNT-SETUP] Automatic Subscription block FAILED: {}", e.getMessage()))
                .onErrorResume(e -> Mono.empty());
    }
}
