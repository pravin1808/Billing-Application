package com.BillingSystem.TyreShopBilling.model.dto;

public record OrderedProductResponse(
        long id,
        String description,
        String size,
        int gst,
        int hsnNumber,
        float price,
        float gstPrice,
        int quantitySell,
        float amount
) {
}
