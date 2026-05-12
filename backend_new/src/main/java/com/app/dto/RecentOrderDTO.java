package com.app.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecentOrderDTO {
    private Long id;
    private String customerName;
    private Double total;
    private String status;
    private String date;
}
