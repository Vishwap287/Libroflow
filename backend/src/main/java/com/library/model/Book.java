package com.library.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Min;
import lombok.*;

@Entity
@Table(name = "books")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Book {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Title is required")
    @Column(nullable = false)
    private String title;

    @NotBlank(message = "Author is required")
    @Column(nullable = false)
    private String author;

    @Column(unique = true)
    private String isbn;

    private String category;

    private String publisher;

    private Integer publishedYear;

    @Min(value = 0, message = "Total copies cannot be negative")
    @Column(nullable = false)
    private Integer totalCopies;

    @Min(value = 0, message = "Available copies cannot be negative")
    @Column(nullable = false)
    private Integer availableCopies;

    private Double price;

    @Column(name = "rack_location")
    private String rackLocation;

    @Column(name = "image_url", length = 1000)
    private String imageUrl;

    @Column(columnDefinition = "TEXT")
    private String description;
}
