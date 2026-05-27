package com.cloudfly.pos.models;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {
    private Long id;
    private String username;
    private String email;
    private String nombres;
    private String apellidos;
    private boolean enabled;
    private boolean accountNoExpired;
    private boolean accountNoLocked;
    private boolean credentialNoExpired;

    public String getFullName() {
        return nombres + " " + apellidos;
    }
}
