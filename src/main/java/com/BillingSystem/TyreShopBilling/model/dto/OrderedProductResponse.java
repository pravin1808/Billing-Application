package com.BillingSystem.TyreShopBilling.model.dto;

public record OrderedProductResponse(
        long id,
        Integer productId,
        String description,
        String size,
        int gst,
        int hsnNumber,
        float price,
        float gstPrice,
        int quantitySell,
        float amount
) {
    public OrderedProductResponse(long id, String description, String size, int gst, int hsnNumber, float price, float gstPrice, int quantitySell, float amount) {
        this(id, null, description, size, gst, hsnNumber, price, gstPrice, quantitySell, amount);
    }
}
