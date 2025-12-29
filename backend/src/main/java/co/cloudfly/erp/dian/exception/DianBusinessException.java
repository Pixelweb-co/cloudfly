package co.cloudfly.erp.dian.exception;

/**
 * Excepción de negocio para el módulo DIAN
 */
public class DianBusinessException extends RuntimeException {

    private final String code;

    public DianBusinessException(String message) {
        super(message);
        this.code = "DIAN_ERROR";
    }

    public DianBusinessException(String code, String message) {
        super(message);
        this.code = code;
    }

    public DianBusinessException(String message, Throwable cause) {
        super(message, cause);
        this.code = "DIAN_ERROR";
    }

    public String getCode() {
        return code;
    }
}
