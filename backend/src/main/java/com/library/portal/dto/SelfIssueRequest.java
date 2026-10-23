package com.library.portal.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SelfIssueRequest {

    @NotNull(message = "Book id is required")
    private Long bookId;

    // number of days until due, defaults to 14 if not provided
    private Integer loanDays;
}
