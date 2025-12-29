package co.cloudfly.erp.dian.domain.enums;

/**
 * Tipos de documento soportados por la DIAN
 */
public enum DianDocumentType {
    INVOICE("Factura de Venta"),
    CREDIT_NOTE("Nota Crédito"),
    DEBIT_NOTE("Nota Débito"),
    SUPPORT_DOCUMENT("Documento Soporte"),
    PAYROLL("Nómina Electrónica");

    private final String description;

    DianDocumentType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
