package com.BillingSystem.TyreShopBilling.model.dto;

public record ProductRequest(
        String description,
        String size,
        int hsnNumber,
        int gst,
        int quantity
) {
}
