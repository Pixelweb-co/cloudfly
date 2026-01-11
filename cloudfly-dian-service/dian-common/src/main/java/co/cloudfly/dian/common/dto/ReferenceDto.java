package co.cloudfly.dian.common.dto;

import lombok.*;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReferenceDto {
    private String documentNumber;
    private String cufe;
    private LocalDate issueDate;
}
