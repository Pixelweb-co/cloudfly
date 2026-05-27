package co.cloudfly.dian.common.dto;

import lombok.*;

/**
 * DTO para dirección física
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AddressDto {

    private String addressLine; // Dirección completa
    private String cityName;
    private String cityCode;
    private String departmentName;
    private String departmentCode;
    private String countryCode; // CO
    private String countryName; // Colombia
    private String postalZone; // Código postal
}
