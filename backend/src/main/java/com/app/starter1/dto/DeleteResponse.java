package com.app.starter1.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Data
@AllArgsConstructor
@Setter
@Getter
public class DeleteResponse {
    private String result;
    private Long id;
}
