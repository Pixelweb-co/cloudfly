package co.cloudfly.dian.common.enums;

/**
 * Tipos de documento electrónico DIAN
 */
public enum ElectronicDocumentType {
    INVOICE("Factura Electrónica"),
    CREDIT_NOTE("Nota Crédito"),
    DEBIT_NOTE("Nota Débito"),
    PAYROLL("Nómina Electrónica");

    private final String description;

    ElectronicDocumentType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
