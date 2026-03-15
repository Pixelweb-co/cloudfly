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
import com.app.persistence.repository.ChatbotConfigRepository;
import com.app.persistence.entity.ChatbotConfig;
import com.app.persistence.entity.ChatbotType;
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
    private final ChatbotConfigRepository chatbotConfigRepository;
    private final com.app.persistence.services.ChatbotService chatbotService;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

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

                    TenantEntity tenant = TenantEntity.builder()
                            .id(user.getCustomerId())
                            .name(form.getName())
                            .nit(form.getNit())
                            .phone(form.getPhone())
                            .email(form.getEmail())
                            .address(form.getAddress())
                            .contact(form.getContact())
                            .position(form.getPosition())
                            .type(form.getType())
                            .status(Boolean.parseBoolean(form.getStatus()))
                            .businessType(form.getBusinessType())
                            .businessDescription(form.getObjetoSocial())
                            .isMasterTenant(true)
                            .esEmisorFE(false)
                            .esEmisorPrincipal(true)
                            .createdAt(LocalDateTime.now())
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
                                            Category defaultCategory = Category.builder()
                                                    .categoryName("General")
                                                    .description("Categoría por defecto")
                                                    .status(true)
                                                    .tenantId(savedTenant.getId())
                                                    .createdAt(LocalDateTime.now())
                                                    .updatedAt(LocalDateTime.now())
                                                    .build();

                                            log.info("📂 [ACCOUNT-SETUP] Saving Default Category...");
                                            return categoryRepository.save(defaultCategory)
                                                    .doOnNext(scat -> log.info("✅ [ACCOUNT-SETUP] Category saved successfully"))
                                                    .flatMap(savedCategory -> {
                                                        user.setCustomerId(savedTenant.getId());
                                                        log.info("👤 [ACCOUNT-SETUP] Linking User to Customer ID: {}", savedTenant.getId());
                                                        return userRepository.save(user)
                                                                .doOnNext(su -> log.info("✅ [ACCOUNT-SETUP] User updated successfully"))
                                                                .flatMap(savedUser -> {
                                                                    log.info("💳 [ACCOUNT-SETUP] Initializing Automatic Subscription...");
                                                                    return handleAutomaticSubscription(savedTenant.getId())
                                                                        .doOnSuccess(v -> log.info("✅ [ACCOUNT-SETUP] Automatic Subscription block complete"))
                                                                        .then(userService.convertToDto(savedUser))
                                                                        .flatMap(userDto -> {
                                                                            log.info("🏥 [ACCOUNT-SETUP] Verifying Evolution API Health...");
                                                                            return evolutionService.checkHealth()
                                                                                .timeout(java.time.Duration.ofSeconds(10))
                                                                                .flatMap(health -> {
                                                                                    if (!health) {
                                                                                        log.warn("⚠️ [ACCOUNT-SETUP] Evolution API health check failed, proceeding WITHOUT instance.");
                                                                                        return Mono.just(userDto);
                                                                                    }
                                                                                    log.info("📱 [ACCOUNT-SETUP] Validating WhatsApp number: {}", form.getPhone());
                                                                                    return evolutionService.isOnWhatsApp("cloudfly_chatbot1", form.getPhone())
                                                                                            .timeout(java.time.Duration.ofSeconds(15))
                                                                                            .flatMap(isOnWa -> {
                                                                                                if (!isOnWa) {
                                                                                                    log.error("❌ [ACCOUNT-SETUP] Number {} not on WhatsApp", form.getPhone());
                                                                                                    return Mono.error(new RuntimeException("El número proporcionado no tiene una cuenta de WhatsApp activa."));
                                                                                                }
                                                                                                String instanceName = "cloudfly_" + savedCompany.getId();
                                                                                                log.info("🚀 [ACCOUNT-SETUP] Creating/Fetching QR for instance: {}", instanceName);
                                                                                                return evolutionService.createInstance(instanceName)
                                                                                                        .timeout(java.time.Duration.ofSeconds(30))
                                                                                                        .flatMap(instanceData -> {
                                                                                                            log.info("📝 [ACCOUNT-SETUP] Persisting ChatbotConfig for company: {}", savedCompany.getId());
                                                                                                            ChatbotConfig chatbotConfig = ChatbotConfig.builder()
                                                                                                                    .tenantId(savedTenant.getId())
                                                                                                                    .companyId(savedCompany.getId())
                                                                                                                    .instanceName(instanceName)
                                                                                                                    .chatbotType(ChatbotType.SALES)
                                                                                                                    .isActive(false)
                                                                                                                    .createdAt(LocalDateTime.now())
                                                                                                                    .updatedAt(LocalDateTime.now())
                                                                                                                    .build();

                                                                                                            return chatbotConfigRepository.save(chatbotConfig)
                                                                                                                    .doOnNext(cc -> log.info("✅ [ACCOUNT-SETUP] ChatbotConfig saved"))
                                                                                                                    .then(Mono.defer(() -> {
                                                                                                                        log.info("📧 [ACCOUNT-SETUP] Sending welcome notification to Kafka...");
                                                                                                                        Map<String, Object> welcomeMsg = new HashMap<>();
                                                                                                                        welcomeMsg.put("phoneNumber", form.getPhone());
                                                                                                                        welcomeMsg.put("instanceName", instanceName);
                                                                                                                        return kafkaTemplate.send("welcome-notifications", welcomeMsg).then();
                                                                                                                    }))
                                                                                                                    .thenReturn(userDto);
                                                                                                        });
                                                                                            });
                                                                                })
                                                                                .onErrorResume(e -> {
                                                                                    log.error("🛑 [ACCOUNT-SETUP] Evolution integration failed but continuing: {}", e.getMessage());
                                                                                    return Mono.just(userDto);
                                                                                });
                                                                        });
                                                                });
                                                    });
                                        });
                            });
                })
                .map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.notFound().build());
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
                            .flatMap(savedSub -> planModuleRepository.findByPlanId(freePlan.getId())
                                    .map(pm -> {
                                        log.info("🔗 [ACCOUNT-SETUP] Linking Module {} to Subscription {}", pm.getModuleId(), savedSub.getId());
                                        return SubscriptionModuleEntity.builder()
                                                .subscriptionId(savedSub.getId())
                                                .moduleId(pm.getModuleId())
                                                .build();
                                    })
                                    .collectList()
                                    .flatMapMany(subscriptionModuleRepository::saveAll)
                                    .doOnError(err -> log.error("❌ [ACCOUNT-SETUP] Failed to save SubscriptionModules: {}", err.getMessage()))
                                    .then());
                })
                .doOnError(e -> log.error("🛑 [ACCOUNT-SETUP] Automatic Subscription block FAILED: {}", e.getMessage()))
                .onErrorResume(e -> Mono.empty());
    }
}
