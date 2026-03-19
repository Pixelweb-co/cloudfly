package com.app.controllers;

import com.app.dto.ChannelTypeConfigDTO;
import com.app.persistence.services.ChannelTypeConfigService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Slf4j
@RestController
@RequestMapping("/api/channel-types")
@RequiredArgsConstructor
public class ChannelTypeConfigController {

    private final ChannelTypeConfigService service;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<ChannelTypeConfigDTO> create(@RequestBody ChannelTypeConfigDTO dto) {
        return service.createChannelTypeConfig(dto);
    }

    @GetMapping("/{id}")
    public Mono<ChannelTypeConfigDTO> getById(@PathVariable Long id) {
        return service.getById(id);
    }

    @GetMapping("/by-name/{typeName}")
    public Mono<ChannelTypeConfigDTO> getByName(@PathVariable String typeName) {
        return service.getByName(typeName);
    }

    @GetMapping
    public Flux<ChannelTypeConfigDTO> getAll() {
        return service.getAll();
    }

    @GetMapping("/active")
    public Flux<ChannelTypeConfigDTO> getActive() {
        return service.getActive();
    }

    @PutMapping("/{id}")
    public Mono<ChannelTypeConfigDTO> update(@PathVariable Long id, @RequestBody ChannelTypeConfigDTO dto) {
        return service.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public Mono<Void> delete(@PathVariable Long id) {
        return service.delete(id);
    }

    @PatchMapping("/{id}/toggle-status")
    public Mono<ChannelTypeConfigDTO> toggleStatus(@PathVariable Long id) {
        return service.toggleStatus(id);
    }
}
