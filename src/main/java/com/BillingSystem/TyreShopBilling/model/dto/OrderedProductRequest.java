package com.BillingSystem.TyreShopBilling.model.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

public record OrderedProductRequest(
        @NotBlank(message = "Ordered product description is required")
        String description,

        @NotBlank(message = "Ordered product size is required")
        String size,

        @Min(value = 0, message = "GST rate cannot be negative")
        @Max(value = 100, message = "GST rate cannot exceed 100%")
        int gst,

        @Positive(message = "HSN number must be a positive integer")
        int hsnNumber,

        @Positive(message = "GST price must be greater than 0")
        float gstPrice,

        @Min(value = 1, message = "Quantity to sell must be at least 1")
        int quantitySell
) {
}
