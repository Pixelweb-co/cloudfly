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
                            .isMasterTenant(true)
                            .esEmisorFE(false)
                            .esEmisorPrincipal(true)
                            .createdAt(user.getCustomerId() == null ? LocalDateTime.now() : null) // Solo si es nuevo
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
                                            return userRepository.save(user)
                                                .doOnNext(su -> log.info("✅ [ACCOUNT-SETUP] User updated successfully"))
                                                .flatMap(savedUser -> {
                                                    log.info("🏥 [ACCOUNT-SETUP] Verifying Evolution API Health...");
                                                    return evolutionService.checkHealth()
                                                        .timeout(java.time.Duration.ofSeconds(10))
                                                        .flatMap(health -> {
                                                            Mono<UserDto> baseFlow = userService.convertToDto(savedUser);
                                                            
                                                            if (!health) {
                                                                log.warn("⚠️ [ACCOUNT-SETUP] Evolution API health check failed, creating defaults with fallback name.");
                                                                return onboardingDefaultsService.performDefaultSetup(savedTenant.getId(), savedCompany.getId(), "evolution_offline")
                                                                        .then(createDefaultCategory(savedTenant.getId()))
                                                                        .then(handleAutomaticSubscription(savedTenant.getId()))
                                                                        .then(baseFlow);
                                                            } else {
                                                                log.info("📱 [ACCOUNT-SETUP] Validating WhatsApp number: {}", form.getPhone());
                                                                return evolutionService.isOnWhatsApp("cloudfly_chatbot1", form.getPhone())
                                                                    .timeout(java.time.Duration.ofSeconds(15))
                                                                    .flatMap(isOnWa -> {
                                                                        if (!isOnWa) {
                                                                            log.warn("❌ [ACCOUNT-SETUP] Number {} not on WhatsApp, continuing without WA instance.", form.getPhone());
                                                                            return onboardingDefaultsService.performDefaultSetup(savedTenant.getId(), savedCompany.getId(), "evolution_no_wa")
                                                                                    .then(createDefaultCategory(savedTenant.getId()))
                                                                                    .then(handleAutomaticSubscription(savedTenant.getId()))
                                                                                    .then(baseFlow);
                                                                        }
                                                                        
                                                                        String instanceName = "cloudfly_t" + savedTenant.getId() + "_c" + savedCompany.getId();
                                                                        log.info("🚀 [ACCOUNT-SETUP] Creating/Fetching QR for instance: {}", instanceName);
                                                                        return evolutionService.createInstance(instanceName)
                                                                            .timeout(java.time.Duration.ofSeconds(30))
                                                                            .flatMap(instanceData -> {
                                                                                log.info("📝 [ACCOUNT-SETUP] Persisting ChannelConfig for company: {}", savedCompany.getId());
                                                                                ChannelConfig channelConfig = ChannelConfig.builder()
                                                                                        .tenantId(savedTenant.getId())
                                                                                        .companyId(savedCompany.getId())
                                                                                        .instanceName(instanceName)
                                                                                        .channelType(ChannelType.AI)
                                                                                        .isActive(false)
                                                                                        .createdAt(LocalDateTime.now())
                                                                                        .updatedAt(LocalDateTime.now())
                                                                                        .build();

                                                                                return channelConfigRepository.save(channelConfig)
                                                                                        .doOnNext(cc -> log.info("✅ [ACCOUNT-SETUP] ChannelConfig saved"))
                                                                                        .then(onboardingDefaultsService.performDefaultSetup(savedTenant.getId(), savedCompany.getId(), instanceName))
                                                                                        .then(createDefaultCategory(savedTenant.getId()))
                                                                                        .then(handleAutomaticSubscription(savedTenant.getId()))
                                                                                        .then(Mono.defer(() -> {
                                                                                            log.info("📧 [ACCOUNT-SETUP] Sending welcome notification to Kafka...");
                                                                                            Map<String, Object> welcomeMsg = new HashMap<>();
                                                                                            welcomeMsg.put("phoneNumber", form.getPhone());
                                                                                            welcomeMsg.put("instanceName", instanceName);
                                                                                            return kafkaTemplate.send("welcome-notifications", welcomeMsg).then();
                                                                                        }))
                                                                                        .then(baseFlow);
                                                                            });
                                                                    })
                                                                    .onErrorResume(e -> {
                                                                        log.error("🛑 [ACCOUNT-SETUP] WhatsApp flow failed: {}. Falling back to basic setup.", e.getMessage());
                                                                        return onboardingDefaultsService.performDefaultSetup(savedTenant.getId(), savedCompany.getId(), "evolution_error")
                                                                                .then(createDefaultCategory(savedTenant.getId()))
                                                                                .then(handleAutomaticSubscription(savedTenant.getId()))
                                                                                .then(baseFlow);
                                                                    });
                                                            }
                                                        });
                                                });
                                        });
                            });
                })
                .map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.notFound().build());
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

    private Mono<Void> handleAutomaticSubscription(Long customerId) {
        log.info("🔍 [ACCOUNT-SETUP] Searching for Free Plan...");
        return planRepository.findByIsFreeTrue()
                .next()
                .switchIfEmpty(Mono.error(new RuntimeException("Error: No se encontró ningún Plan Gratuito configurado.")))
                .flatMap(freePlan -> {
                    log.info("✅ [ACCOUNT-SETUP] Found Free Plan: {}. Activating for Customer: {}", freePlan.getName(), customerId);
                    SubscriptionEntity subscription = SubscriptionEntity.builder()
                            .planId(freePlan.getId())
                            .customerId(customerId)
                            .status("ACTIVE")
                            .billingCycle("MONTHLY")
                            .startDate(LocalDateTime.now())
                            .endDate(LocalDateTime.now().plusDays(freePlan.getDurationDays() != null ? freePlan.getDurationDays() : 14))
                            .usersLimit(freePlan.getUsersLimit())
                            .aiTokensLimit(freePlan.getAiTokensLimit())
                            .monthlyPrice(BigDecimal.ZERO)
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
