package co.cloudfly.dian.common.enums;

/**
 * Estado del procesamiento del documento DIAN
 */
public enum ElectronicDocumentStatus {
    RECEIVED("Recibido del ERP"),
    PROCESSING("En procesamiento"),
    ACCEPTED("Aceptado por DIAN"),
    REJECTED("Rechazado por DIAN"),
    ERROR("Error en procesamiento");

    private final String description;

    ElectronicDocumentStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
