package com.app.persistence.services;

import com.app.persistence.entity.ChannelEntity;
import com.app.persistence.repository.ChannelRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ChannelService {

    private final ChannelRepository channelRepository;

    public Flux<ChannelEntity> getChannels(Long companyId, Long tenantId) {
        return channelRepository.findByCompanyIdAndTenantId(companyId, tenantId);
    }

    public Mono<ChannelEntity> createChannel(ChannelEntity channel, Long companyId, Long tenantId) {
        channel.setCompanyId(companyId);
        channel.setTenantId(tenantId);
        channel.setCreatedAt(LocalDateTime.now());
        channel.setUpdatedAt(LocalDateTime.now());
        if (channel.getStatus() == null) channel.setStatus(true);
        return channelRepository.save(channel);
    }

    public Mono<ChannelEntity> getChannelById(Long id, Long companyId, Long tenantId) {
        return channelRepository.findById(id)
                .filter(c -> c.getCompanyId().equals(companyId) && c.getTenantId().equals(tenantId));
    }
}
