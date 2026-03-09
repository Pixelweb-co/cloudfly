package com.app.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccountSetupRequest {
    private Long userId;
    private ClienteForm form;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ClienteForm {
        private String name;
        private String nit;
        private String phone;
        private String email;
        private String address;
        private String contact;
        private String position;
        private String businessType;
        private String objetoSocial;
        private String status;
        private String type;
    }
}
