package com.app.starter1.events;

import com.app.starter1.persistence.entity.Invoice;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class InvoiceCreatedEvent extends ApplicationEvent {

    private final Invoice invoice;

    public InvoiceCreatedEvent(Object source, Invoice invoice) {
        super(source);
        this.invoice = invoice;
    }
}
