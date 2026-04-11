package com.app.controllers;

import com.app.persistence.entity.ChannelEntity;
import com.app.persistence.services.ChannelService;
import com.app.persistence.services.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/marketing/channels")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ChannelController {

    private final ChannelService channelService;
    private final UserService userService;

    private Mono<Long> getCurrentTenantId() {
        return ReactiveSecurityContextHolder.getContext()
                .map(ctx -> ctx.getAuthentication().getName())
                .flatMap(userService::findByUsername)
                .map(user -> {
                    return user.getCustomerId();
                });
    }

    private Mono<Long> getCurrentCompanyId() {
        // Fallback to principal company for the tenant
        return ReactiveSecurityContextHolder.getContext()
                .map(ctx -> ctx.getAuthentication().getName())
                .flatMap(userService::findByUsername)
                .map(user -> {
                    // This project usually has customerId as tenantId
                    return user.getCustomerId(); 
                });
    }

    @GetMapping
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SUPERADMIN', 'USER')")
    public Flux<ChannelEntity> getChannels() {
        return Mono.zip(getCurrentCompanyId(), getCurrentTenantId())
                .flatMapMany(tuple -> {
                    return channelService.getChannels(tuple.getT1(), tuple.getT2());
                });
    }

    @PostMapping
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SUPERADMIN')")
    public Mono<ChannelEntity> createChannel(@RequestBody ChannelEntity channel) {
        return Mono.zip(getCurrentCompanyId(), getCurrentTenantId())
                .flatMap(tuple -> {
                    return channelService.createChannel(channel, tuple.getT1(), tuple.getT2());
                });
    }

    @GetMapping("/{id}")
    public Mono<ChannelEntity> getChannelById(@PathVariable Long id) {
        return Mono.zip(getCurrentCompanyId(), getCurrentTenantId())
                .flatMap(tuple -> {
                    return channelService.getChannelById(id, tuple.getT1(), tuple.getT2());
                });
    }

}
