package com.app.services;

import com.app.persistence.entity.CalendarEventEntity;
import com.app.persistence.entity.JobStatus;
import com.app.persistence.entity.ScheduledJobEntity;
import com.app.persistence.repository.ScheduledJobRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class JobGeneratorService {

    private final ScheduledJobRepository scheduledJobRepository;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    public Mono<Void> generateJobsForEvent(CalendarEventEntity event) {
        log.info("Generating jobs for event: {} (Type: {})", event.getId(), event.getEventType());
        
        return scheduledJobRepository.deleteByEventId(event.getId())
                .then(Mono.defer(() -> {
                    List<ScheduledJobEntity> jobs = new ArrayList<>();

                    switch (event.getEventType()) {
                        case NOTIFICATION:
                            boolean reminderAdded = false;
                            try {
                                if (event.getPayload() != null) {
                                    java.util.Map<String, Object> config = objectMapper.readValue(event.getPayload(), java.util.Map.class);
                                    if (config.containsKey("remindBefore")) {
                                        Number amount = (Number) config.get("remindBefore");
                                        String unit = (String) config.getOrDefault("remindUnit", "MINUTES");
                                        LocalDateTime remindTime = calculateRemindTime(event.getStartTime(), amount.intValue(), unit);
                                        log.info("Event {} startTime: {}, amount: {}, unit: {}, remindTime: {}", event.getId(), event.getStartTime(), amount, unit, remindTime);
                                        jobs.add(buildJob(event, remindTime));
                                        reminderAdded = true;
                                    }
                                    
                                    if (config.containsKey("sendConfirmation") && Boolean.TRUE.equals(config.get("sendConfirmation"))) {
                                        log.info("Event {} requested immediate confirmation job", event.getId());
                                        jobs.add(buildJob(event, LocalDateTime.now()));
                                    }
                                }
                            } catch (Exception e) {
                                log.warn("Could not parse payload for custom reminder: {}", e.getMessage());
                            }
                            
                            if (!reminderAdded) {
                                jobs.add(buildJob(event, event.getStartTime()));
                            }
                            break;

                        case APPOINTMENT:
                            jobs.add(buildJob(event, LocalDateTime.now()));
                            jobs.add(buildJob(event, event.getStartTime().minusHours(24)));
                            jobs.add(buildJob(event, event.getStartTime().minusHours(1)));
                            jobs.add(buildJob(event, event.getStartTime()));
                            break;

                        case FINANCIAL:
                            jobs.add(buildJob(event, event.getStartTime().minusDays(3)));
                            jobs.add(buildJob(event, event.getStartTime()));
                            jobs.add(buildJob(event, event.getStartTime().plusDays(1)));
                            break;

                        case SUBSCRIPTION:
                            jobs.add(buildJob(event, event.getStartTime()));
                            jobs.add(buildJob(event, event.getStartTime().plusDays(3)));
                            break;

                        case REST_ACTION:
                            jobs.add(buildJob(event, event.getStartTime()));
                            break;

                        default:
                            jobs.add(buildJob(event, event.getStartTime()));
                            break;
                    }

                    LocalDateTime now = LocalDateTime.now();
                    List<ScheduledJobEntity> validJobs = jobs.stream()
                            .filter(j -> j.getExecuteAt().isAfter(now) || j.getExecuteAt().equals(now))
                            .toList();

                    if (validJobs.isEmpty() && !jobs.isEmpty()) {
                        log.warn("All calculated jobs for event {} were in the past! Forcing execution at now()", event.getId());
                        validJobs = List.of(buildJob(event, now));
                    }

                    return scheduledJobRepository.saveAll(validJobs).then();
                }));
    }

    private LocalDateTime calculateRemindTime(LocalDateTime start, int amount, String unit) {
        switch (unit.toUpperCase()) {
            case "MINUTES": return start.minusMinutes(amount);
            case "HOURS": return start.minusHours(amount);
            case "DAYS": return start.minusDays(amount);
            case "WEEKS": return start.minusWeeks(amount);
            default: return start.minusMinutes(amount);
        }
    }

    private ScheduledJobEntity buildJob(CalendarEventEntity event, LocalDateTime executeAt) {
        return ScheduledJobEntity.builder()
                .eventId(event.getId())
                .executeAt(executeAt)
                .status(JobStatus.PENDING)
                .retryCount(0)
                .maxRetries(3)
                .createdAt(LocalDateTime.now())
                .build();
    }
}
