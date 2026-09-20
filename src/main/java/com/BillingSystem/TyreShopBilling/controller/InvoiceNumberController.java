package com.BillingSystem.TyreShopBilling.controller;

import com.BillingSystem.TyreShopBilling.service.InvoiceNumberService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class InvoiceNumberController {

    private InvoiceNumberService invoiceService;

    @PutMapping("/order/invoice/{invoiceNumber}")
    public ResponseEntity<String> updateInvoiceNumber(@PathVariable int invoiceNumber) {
        invoiceService.updateInvoiceNumber(invoiceNumber);
        return ResponseEntity.ok("Invoice number updated to " + invoiceNumber + " successfully.");
    }

    @Autowired
    public void setInvoiceService(InvoiceNumberService invoiceService) {
        this.invoiceService = invoiceService;
    }
}
