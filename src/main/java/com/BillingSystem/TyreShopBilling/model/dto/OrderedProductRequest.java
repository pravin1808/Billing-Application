package com.BillingSystem.TyreShopBilling.model.dto;

public record OrderedProductRequest(
        String description,
        String size,
        int gst,
        float gstPrice,
        int quantitySell
) {
}
