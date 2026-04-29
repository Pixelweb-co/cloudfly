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
        List<ScheduledJobEntity> jobs = new ArrayList<>();

        switch (event.getEventType()) {
            case NOTIFICATION:
                // Check for custom reminder in payload
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
                    }
                } catch (Exception e) {
                    log.warn("Could not parse payload for custom reminder: {}", e.getMessage());
                }
                
                // Only add the start time execution if no reminder was configured
                if (!reminderAdded) {
                    jobs.add(buildJob(event, event.getStartTime()));
                }
                break;

            case APPOINTMENT:
                // 1. Immediate confirmation
                jobs.add(buildJob(event, LocalDateTime.now()));
                // 2. 24h reminder
                jobs.add(buildJob(event, event.getStartTime().minusHours(24)));
                // 3. 1h reminder
                jobs.add(buildJob(event, event.getStartTime().minusHours(1)));
                // 4. Execution
                jobs.add(buildJob(event, event.getStartTime()));
                break;

            case FINANCIAL:
                // 1. 3 days before reminder
                jobs.add(buildJob(event, event.getStartTime().minusDays(3)));
                // 2. Due date reminder
                jobs.add(buildJob(event, event.getStartTime()));
                // 3. 1 day after overdue
                jobs.add(buildJob(event, event.getStartTime().plusDays(1)));
                break;

            case SUBSCRIPTION:
                // 1. Execution
                jobs.add(buildJob(event, event.getStartTime()));
                // 2. 3 days after (suspension if not paid)
                jobs.add(buildJob(event, event.getStartTime().plusDays(3)));
                break;

            case REST_ACTION:
                // Just one execution job
                jobs.add(buildJob(event, event.getStartTime()));
                break;

            default:
                jobs.add(buildJob(event, event.getStartTime()));
                break;
        }

        // Filter out jobs that are already in the past
        LocalDateTime now = LocalDateTime.now();
        log.info("Current now(): {}", now);
        List<ScheduledJobEntity> validJobs = jobs.stream()
                .filter(j -> {
                    boolean isValid = j.getExecuteAt().isAfter(now) || j.getExecuteAt().equals(now);
                    log.info("Evaluating job for event {}, executeAt: {}, isAfterNow: {}", event.getId(), j.getExecuteAt(), isValid);
                    return isValid;
                })
                .toList();

        if (validJobs.isEmpty() && !jobs.isEmpty()) {
            log.warn("All calculated jobs for event {} were in the past! Forcing execution at now()", event.getId());
            // If all were in the past, at least schedule one for now if it's the execution
            validJobs = List.of(buildJob(event, now));
        }

        return scheduledJobRepository.saveAll(validJobs).then();
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
