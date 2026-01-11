package co.cloudfly.dian.common.dto;

import lombok.*;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentDto {
    private String paymentMeansCode; // 10=Efectivo, 48=Tarjeta, etc.
    private LocalDate dueDate;
    private String paymentId;
}
