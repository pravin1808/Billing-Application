package com.BillingSystem.TyreShopBilling.model.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Builder;

import java.util.List;

@Builder
public record OrderProductsUpdateRequest(
        @NotEmpty(message = "Order must contain at least one product")
        List<@Valid OrderedProductRequest> orderedProducts
) {
}
