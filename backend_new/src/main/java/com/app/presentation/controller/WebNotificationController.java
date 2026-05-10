package com.app.presentation.controller;

import com.app.persistence.entity.WebNotificationEntity;
import com.app.persistence.services.WebNotificationService;
import com.app.persistence.services.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class WebNotificationController {
    private final WebNotificationService service;
    private final UserService userService;

    @GetMapping
    public Flux<WebNotificationEntity> getMyNotifications() {
        return userService.getCurrentUser()
                .flatMapMany(user -> service.getNotifications(user.getCustomerId(), user.getId()));
    }

    @PutMapping("/{id}/read")
    public Mono<WebNotificationEntity> markAsRead(@PathVariable String id) {
        return service.markAsRead(id);
    }

    @DeleteMapping("/{id}")
    public Mono<WebNotificationEntity> delete(@PathVariable String id) {
        return service.delete(id);
    }
}
