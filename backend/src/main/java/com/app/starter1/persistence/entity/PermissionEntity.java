package com.app.starter1.persistence.entity;


import jakarta.persistence.*;
import lombok.*;

@Setter
@Getter
@Table(name = "permissions")
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Data
@Builder
public class PermissionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false,updatable = false)
    private String name;
}
