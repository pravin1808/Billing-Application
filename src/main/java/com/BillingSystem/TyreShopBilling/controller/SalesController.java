package com.BillingSystem.TyreShopBilling.controller;

import com.BillingSystem.TyreShopBilling.service.SalesService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/sales")
public class SalesController {

    private SalesService salesService;

    @GetMapping("/month")
    public ResponseEntity<?> getSalesOfCurrentMonth(
            @RequestParam int year,
            @RequestParam int month){
        return ResponseEntity.ok(salesService.getLast12MonthsSales(year, month));
    }

    @GetMapping("/day")
    public ResponseEntity<?> getSalesPerDay(@RequestParam LocalDate date){
        return ResponseEntity.ok(salesService.getLast7DaysSales(date));
    }

    @Autowired
    public void setSalesService(SalesService salesService){
        this.salesService = salesService;
    }

}
