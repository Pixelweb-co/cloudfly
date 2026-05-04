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
        final LocalDateTime generationTime = LocalDateTime.now();
        
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
                                        jobs.add(buildJob(event, remindTime, generationTime));
                                        reminderAdded = true;
                                    }
                                    
                                    if (config.containsKey("sendConfirmation") && Boolean.TRUE.equals(config.get("sendConfirmation"))) {
                                        log.info("Event {} requested immediate confirmation job", event.getId());
                                        jobs.add(buildJob(event, generationTime, generationTime));
                                    }
                                }
                            } catch (Exception e) {
                                log.warn("Could not parse payload for custom reminder: {}", e.getMessage());
                            }
                            
                            if (!reminderAdded) {
                                jobs.add(buildJob(event, event.getStartTime(), generationTime));
                            }
                            break;

                        case APPOINTMENT:
                            jobs.add(buildJob(event, generationTime, generationTime));
                            jobs.add(buildJob(event, event.getStartTime().minusHours(24), generationTime));
                            jobs.add(buildJob(event, event.getStartTime().minusHours(1), generationTime));
                            jobs.add(buildJob(event, event.getStartTime(), generationTime));
                            break;

                        case FINANCIAL:
                            jobs.add(buildJob(event, event.getStartTime().minusDays(3), generationTime));
                            jobs.add(buildJob(event, event.getStartTime(), generationTime));
                            jobs.add(buildJob(event, event.getStartTime().plusDays(1), generationTime));
                            break;

                        case SUBSCRIPTION:
                            jobs.add(buildJob(event, event.getStartTime(), generationTime));
                            jobs.add(buildJob(event, event.getStartTime().plusDays(3), generationTime));
                            break;

                        case REST_ACTION:
                            jobs.add(buildJob(event, event.getStartTime(), generationTime));
                            break;

                        default:
                            jobs.add(buildJob(event, event.getStartTime(), generationTime));
                            break;
                    }

                    log.info("Current generationTime: {}", generationTime);
                    List<ScheduledJobEntity> validJobs = jobs.stream()
                            .filter(j -> {
                                boolean isValid = j.getExecuteAt().isAfter(generationTime) || j.getExecuteAt().isEqual(generationTime);
                                log.info("Job for event {} executeAt: {}, isValid: {}", event.getId(), j.getExecuteAt(), isValid);
                                return isValid;
                            })
                            .toList();

                    if (validJobs.isEmpty() && !jobs.isEmpty()) {
                        log.warn("All calculated jobs for event {} were in the past! No jobs will be created.", event.getId());
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

    private ScheduledJobEntity buildJob(CalendarEventEntity event, LocalDateTime executeAt, LocalDateTime generationTime) {
        return ScheduledJobEntity.builder()
                .eventId(event.getId())
                .executeAt(executeAt)
                .status(JobStatus.PENDING)
                .retryCount(0)
                .maxRetries(3)
                .createdAt(generationTime)
                .build();
    }
}
