package com.library.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "members")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Member {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Name is required")
    @Column(nullable = false)
    private String name;

    @Email(message = "Enter a valid email")
    @Column(unique = true)
    private String email;

    private String phone;

    private String address;

    @Builder.Default
    private LocalDate membershipDate = LocalDate.now();

    @Builder.Default
    private String status = "ACTIVE";
}
