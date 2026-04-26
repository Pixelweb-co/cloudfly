package com.app.events;

import com.app.services.JobGeneratorService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class CalendarEventListener {

    private final JobGeneratorService jobGeneratorService;

    @EventListener
    @Async // Run in background to not block the main flow
    public void onCalendarEventCreated(CalendarEventCreated event) {
        log.info("🔔 Listener: Processing new calendar event {}", event.getEvent().getId());
        jobGeneratorService.generateJobsForEvent(event.getEvent())
                .subscribe(
                        success -> log.debug("Jobs generated successfully for event {}", event.getEvent().getId()),
                        error -> log.error("Error generating jobs for event {}: {}", event.getEvent().getId(), error.getMessage())
                );
    }
}
