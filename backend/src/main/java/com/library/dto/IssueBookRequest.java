package com.library.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class IssueBookRequest {

    @NotNull(message = "Book id is required")
    private Long bookId;

    @NotNull(message = "Member id is required")
    private Long memberId;

    // number of days until due, defaults to 14 if not provided
    private Integer loanDays;
}
