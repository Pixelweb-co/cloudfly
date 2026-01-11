package co.cloudfly.erp.dian.exception;

/**
 * Excepción cuando no se encuentra un recurso DIAN
 */
public class DianNotFoundException extends RuntimeException {

    public DianNotFoundException(String message) {
        super(message);
    }

    public DianNotFoundException(String resource, Long id) {
        super(String.format("%s con ID %d no encontrado", resource, id));
    }
}
