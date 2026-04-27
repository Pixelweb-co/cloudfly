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

    @Async
    @EventListener
    public void handleCalendarEventCreated(CalendarEventCreated eventCreated) {
        log.info("Event listener caught new event: {}", eventCreated.getEvent().getId());
        jobGeneratorService.generateJobsForEvent(eventCreated.getEvent())
                .subscribe(
                        success -> log.info("Jobs generated for event {}", eventCreated.getEvent().getId()),
                        error -> log.error("Failed to generate jobs for event {}", eventCreated.getEvent().getId(), error)
                );
    }
}
