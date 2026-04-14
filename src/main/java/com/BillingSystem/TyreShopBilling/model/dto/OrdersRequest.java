package com.BillingSystem.TyreShopBilling.model.dto;

import lombok.Builder;

import java.util.List;

@Builder
public record OrdersRequest(
        String customerName,
        long customerMobileNumber,
        String gstInNumber,
        String paymentMethod,
        List<OrderedProductRequest> orderedProducts
) {
}
