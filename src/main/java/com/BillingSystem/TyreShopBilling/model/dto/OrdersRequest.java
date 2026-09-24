package com.BillingSystem.TyreShopBilling.model.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Builder;

import java.util.List;

@Builder
public record OrdersRequest(
        @NotBlank(message = "Customer name is required")
        @Size(max = 100, message = "Customer name cannot exceed 100 characters")
        String customerName,

        @Min(value = 1000000000L, message = "Mobile number must be a valid 10-digit number")
        @Max(value = 9999999999L, message = "Mobile number must be a valid 10-digit number")
        long customerMobileNumber,

        @Size(max = 20, message = "GSTIN cannot exceed 20 characters")
        String gstInNumber,

        @NotBlank(message = "Payment method is required")
        String paymentMethod,

        List<@Valid OrderedProductRequest> orderedProducts,

        List<@Valid OrderedProductRequest> externalOrderedProducts
) {
}
