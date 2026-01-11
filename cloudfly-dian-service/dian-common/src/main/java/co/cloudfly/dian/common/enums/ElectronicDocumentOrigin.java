package co.cloudfly.dian.common.enums;

/**
 * Origen del documento electrónico
 */
public enum ElectronicDocumentOrigin {
    ERP_INVOICE("Factura desde ERP"),
    ERP_POS_INVOICE("Factura desde POS"),
    ERP_PAYROLL("Nómina desde ERP"),
    EXTERNAL_SYSTEM("Sistema Externo");

    private final String description;

    ElectronicDocumentOrigin(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
