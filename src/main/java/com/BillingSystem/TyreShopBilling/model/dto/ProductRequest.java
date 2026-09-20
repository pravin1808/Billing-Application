package com.BillingSystem.TyreShopBilling.model.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record ProductRequest(
        @NotBlank(message = "Product description is required")
        @Size(max = 255, message = "Product description cannot exceed 255 characters")
        String description,

        @NotBlank(message = "Product size is required")
        @Size(max = 100, message = "Product size cannot exceed 100 characters")
        String size,

        @Positive(message = "HSN number must be a positive integer")
        int hsnNumber,

        @Min(value = 0, message = "GST rate cannot be negative")
        @Max(value = 100, message = "GST rate cannot exceed 100%")
        int gst,

        @Min(value = 0, message = "Product quantity cannot be negative")
        int quantity
) {
}
