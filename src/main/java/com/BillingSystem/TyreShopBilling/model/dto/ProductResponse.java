package com.BillingSystem.TyreShopBilling.model.dto;

public record ProductResponse(
        int productId,
        String description,
        String size,
        int gst,
        int hsnNumber,
        int quantity
) {
}
