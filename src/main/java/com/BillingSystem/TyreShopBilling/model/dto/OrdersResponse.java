package com.BillingSystem.TyreShopBilling.model.dto;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDateTime;
import java.util.List;

public record OrdersResponse(
        String customerName,
        long customerMobileNumber,
        String gstInNumber,
        int invoiceNumber,
        @JsonFormat(pattern = "dd-MM-yyyy hh:mm a")
        LocalDateTime orderDate,
        float totalAmount,
        List<OrderedProductResponse> orderedProducts
) {
}
