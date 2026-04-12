package com.BillingSystem.TyreShopBilling.model.dto;

import java.time.LocalDateTime;
import java.util.List;

public record OrdersResponse(
        String customerName,
        long customerMobileNumber,
        String gstInNumber,
        LocalDateTime orderDate,
        float totalAmount,
        List<OrderedProductResponse> orderedProducts
) {
}
