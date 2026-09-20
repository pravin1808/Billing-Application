package com.BillingSystem.TyreShopBilling.exception;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDateTime;

public record ErrorResponse(

        @JsonFormat(pattern = "dd-MM-yyyy hh:mm:ss a")
        LocalDateTime timestamp,

        int status,

        String error,

        String message,

        String path
) {
    public static ErrorResponse of(int status, String error, String message, String path) {
        return new ErrorResponse(LocalDateTime.now(), status, error, message, path);
    }
}
