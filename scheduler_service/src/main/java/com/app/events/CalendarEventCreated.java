package com.app.events;

import com.app.persistence.entity.CalendarEventEntity;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class CalendarEventCreated extends ApplicationEvent {
    private final CalendarEventEntity event;

    public CalendarEventCreated(CalendarEventEntity event) {
        super(event);
        this.event = event;
    }
}
