package com.BillingSystem.TyreShopBilling.model.dto;

import jakarta.validation.constraints.NotBlank;

public record InvoicePathRequest(
        @NotBlank(message = "Invoice folder path is required")
        String invoicePath
) {
}
