package com.BillingSystem.TyreShopBilling.model.dto;

public record OrderedProductRequest(
        String description,
        String size,
        int gst,
        int hsnNumber,
        float gstPrice,
        int quantitySell
) {
}
