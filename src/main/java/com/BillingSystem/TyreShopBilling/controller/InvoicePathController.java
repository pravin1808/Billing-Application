package com.BillingSystem.TyreShopBilling.controller;

import com.BillingSystem.TyreShopBilling.model.dto.InvoicePathRequest;
import com.BillingSystem.TyreShopBilling.service.InvoicePathService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class InvoicePathController {

    private InvoicePathService invoicePathService;

    @PutMapping("/order/invoicePath")
    public ResponseEntity<String> updateInvoicePath(@RequestBody InvoicePathRequest newInvoicePath) {
        invoicePathService.changeInvoicePathFolder(newInvoicePath.invoicePath());
        return ResponseEntity.ok("Invoice folder path updated successfully.");
    }

    @Autowired
    public void setInvoicePathService(InvoicePathService invoicePathService) {
        this.invoicePathService = invoicePathService;
    }
}
