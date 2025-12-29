package co.cloudfly.erp.dian.domain.enums;

/**
 * Tipos de certificado digital
 */
public enum CertificateType {
    P12("PKCS#12"),
    PEM("PEM");

    private final String description;

    CertificateType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
