package com.library.portal.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CreateFineRequest {

    @NotNull(message = "User id is required")
    private Long userId;

    @NotNull(message = "Issue date is required")
    private LocalDate issueDate;

    @NotNull(message = "Due date is required")
    private LocalDate dueDate;

    // optional - leave null if the item hasn't been returned yet
    private LocalDate returnDate;
}
