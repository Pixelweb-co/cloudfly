package com.app.starter1.listeners;

import com.app.starter1.events.InvoiceCreatedEvent;
import com.app.starter1.services.PortfolioService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class PortfolioEventListener {

    private final PortfolioService portfolioService;

    @EventListener
    @Async // Ejecutar asíncronamente para no bloquear la respuesta HTTP de facturación
    public void handleInvoiceCreated(InvoiceCreatedEvent event) {
        log.info("Received InvoiceCreatedEvent for Invoice ID: {}", event.getInvoice().getId());
        try {
            portfolioService.createReceivableFromInvoice(event.getInvoice());
        } catch (Exception e) {
            log.error("Error creating portfolio document for invoice: " + event.getInvoice().getId(), e);
        }
    }
}
