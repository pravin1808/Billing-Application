package com.BillingSystem.TyreShopBilling.service;

import com.BillingSystem.TyreShopBilling.repository.OrderRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class SalesService {

    private OrderRepo orderRepo;

    public Map<String, Float> getLast12MonthsSales(int year, int month) {

        List<Object[]> results = orderRepo.getLast12MonthsSales(year, month);

        Map<String, Float> sales = new LinkedHashMap<>();

        for (Object[] result : results) {
            String yearMonth = (String) result[0];
            Float amount = ((Number) result[1]).floatValue();

            sales.put(yearMonth, amount);
        }

        return sales;
    }

    @Autowired
    public void setOrderRepo(OrderRepo orderRepo){
        this.orderRepo = orderRepo;
    }

}
