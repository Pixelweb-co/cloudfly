package com.app.starter1.persistence.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "documents")
@Data
@Builder
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @Column(name = "equipment", length = 20)
    private Long equipment;

    @Column(name = "tag", length = 80)
    private String tag;

    @Column(name = "name", length = 80)
    private String name;

    @Column(name = "date", length = 10)
    private String date;

    @Column(name = "hour", length = 10)
    private String hour;

    @Column(name = "enabled")
    private Integer enabled;

    @Column(name = "report")
    private Boolean report;
}
