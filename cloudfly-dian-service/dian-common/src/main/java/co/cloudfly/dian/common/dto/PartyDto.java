package co.cloudfly.dian.common.dto;

import lombok.*;

import java.math.BigDecimal;

/**
 * DTO que representa una parte (emisor, receptor, etc.)
 * Estructura compatible con UBL 2.1
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PartyDto {

    // Identificación
    private String identificationType; // NIT, CC, CE, etc.
    private String identificationNumber;
    private String checkDigit; // Dígito de verificación (solo para NIT)

    // Nombre
    private String commercialRegistrationName; // Nombre comercial
    private String legalName; // Razón social
    private String firstName;
    private String familyName;

    // Clasificación tributaria
    private String taxLevelCode; // Régimen fiscal
    private String taxScheme; // IVA, INC, ICA, etc.

    // Dirección
    private AddressDto address;

    // Contacto
    private String telephone;
    private String email;

    // Información adicional
    private String municipalityCode;
    private String countryCode; // CO para Colombia

    // Responsabilidades fiscales
    private String[] fiscalResponsibilities; // O-13, O-15, O-23, R-99-PN, etc.
}
