package com.BillingSystem.TyreShopBilling.model.dto;

public record ProductResponse(
        String description,
        String size,
        int gst,
        int hsnNumber,
        int quantity
) {
}
