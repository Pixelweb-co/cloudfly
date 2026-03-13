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
        log.info("Account setup request for user: {}", request.getUserId());

        return userRepository.findById(request.getUserId())
                .flatMap(user -> {
                    AccountSetupRequest.ClienteForm form = request.getForm();

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
                            .flatMap(savedTenant -> {
                                CompanyEntity company = CompanyEntity.builder()
                                        .tenantId(savedTenant.getId())
                                        .name(savedTenant.getName())
                                        .nit(savedTenant.getNit())
                                        .address(savedTenant.getAddress())
                                        .phone(savedTenant.getPhone())
                                        .status(true)
                                        .isPrincipal(true)
                                        .createdAt(LocalDateTime.now())
                                        .updatedAt(LocalDateTime.now())
                                        .build();

                                return companyRepository.save(company)
                                        .flatMap(savedCompany -> {
                                            Category defaultCategory = Category.builder()
                                                    .categoryName("General")
                                                    .description("Categoría por defecto")
                                                    .status(true)
                                                    .tenantId(savedTenant.getId())
                                                    .createdAt(LocalDateTime.now())
                                                    .updatedAt(LocalDateTime.now())
                                                    .build();

                                            return categoryRepository.save(defaultCategory)
                                                    .flatMap(savedCategory -> {
                                                        user.setCustomerId(savedTenant.getId());
                                                        return userRepository.save(user)
                                                                .flatMap(savedUser -> handleAutomaticSubscription(savedTenant.getId())
                                                                        .then(userService.convertToDto(savedUser))
                                                                        .flatMap(userDto -> {
                                                                            String instanceName = "cloudfly_" + user.getUsername().toLowerCase().replaceAll("[^a-z0-9]", "_");

                                                                            ChatbotConfig chatbotConfig = ChatbotConfig.builder()
                                                                                    .tenantId(savedTenant.getId())
                                                                                    .instanceName(instanceName)
                                                                                    .chatbotType(ChatbotType.SALES)
                                                                                    .isActive(false)
                                                                                    .agentName("Asistente Cloudfly")
                                                                                    .createdAt(LocalDateTime.now())
                                                                                    .updatedAt(LocalDateTime.now())
                                                                                    .build();

                                                                            return chatbotConfigRepository.save(chatbotConfig)
                                                                                    .then(Mono.defer(() -> {
                                                                                        Map<String, Object> welcomeMsg = Map.of(
                                                                                                "phoneNumber", form.getPhone(),
                                                                                                "customerName", form.getName(),
                                                                                                "contactName", form.getContact(),
                                                                                                "email", form.getEmail(),
                                                                                                "businessType", form.getBusinessType(),
                                                                                                "instanceName", instanceName
                                                                                        );
                                                                                        log.info("📧 [ACCOUNT-SETUP] Sending notification for: {}", instanceName);
                                                                                        return kafkaTemplate.send("welcome-notifications", welcomeMsg).then();
                                                                                    }))
                                                                                    .thenReturn(userDto);
                                                                        }));
                                                    });
                                        });
                            });
                })
                .map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    private Mono<Void> handleAutomaticSubscription(Long customerId) {
        log.info("Creating automatic free subscription for customer: {}", customerId);
        return planRepository.findByIsFreeTrue()
                .next()
                .flatMap(freePlan -> {
                    SubscriptionEntity subscription = SubscriptionEntity.builder()
                            .planId(freePlan.getId())
                            .customerId(customerId)
                            .status("ACTIVE")
                            .billingCycle("MONTHLY")
                            .startDate(LocalDateTime.now())
                            .endDate(LocalDateTime.now().plusDays(freePlan.getDurationDays() != null ? freePlan.getDurationDays() : 365))
                            .aiTokensLimit(freePlan.getAiTokensLimit())
                            .usersLimit(freePlan.getUsersLimit())
                            .monthlyPrice(java.math.BigDecimal.ZERO)
                            .createdAt(LocalDateTime.now())
                            .updatedAt(LocalDateTime.now())
                            .build();

                    return subscriptionRepository.save(subscription)
                            .flatMap(savedSub -> planModuleRepository.findByPlanId(freePlan.getId())
                                    .map(pm -> SubscriptionModuleEntity.builder()
                                            .subscriptionId(savedSub.getId())
                                            .moduleId(pm.getModuleId())
                                            .build())
                                    .collectList()
                                    .flatMapMany(subscriptionModuleRepository::saveAll)
                                    .then());
                });
    }
}
