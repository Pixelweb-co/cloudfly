package co.cloudfly.dian.core.application.service.processor;

import co.cloudfly.dian.common.event.ElectronicDocumentEvent;
import co.cloudfly.dian.core.domain.entity.ElectronicDocument;

/**
 * Interfaz para procesadores de documentos electrónicos DIAN
 */
public interface DocumentProcessor {

    /**
     * Procesa un documento electrónico
     * 
     * @param document Documento guardado en BD con estado RECEIVED
     * @param event    Evento original de Kafka
     */
    void process(ElectronicDocument document, ElectronicDocumentEvent event);

    /**
     * Indica si este procesador soporta el tipo de documento
     */
    boolean supports(ElectronicDocument document);
}
