package com.app.events;

import com.app.persistence.entity.CalendarEventEntity;
import lombok.Getter;

@Getter
public class CalendarEventUpdated {
    private final CalendarEventEntity event;

    public CalendarEventUpdated(CalendarEventEntity event) {
        this.event = event;
    }
}
