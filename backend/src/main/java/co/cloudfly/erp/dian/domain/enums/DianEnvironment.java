package co.cloudfly.erp.dian.domain.enums;

/**
 * Ambientes de operación DIAN
 */
public enum DianEnvironment {
    TEST("Habilitación/Pruebas"),
    PRODUCTION("Producción");

    private final String description;

    DianEnvironment(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
