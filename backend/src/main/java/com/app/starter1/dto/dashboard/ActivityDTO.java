package com.app.starter1.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ActivityDTO {
    private String id;
    private String type;
    private String text;
    private String detail;
    private LocalDateTime timestamp;
    private String link;
}
