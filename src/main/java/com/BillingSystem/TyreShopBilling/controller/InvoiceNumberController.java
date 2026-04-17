package com.BillingSystem.TyreShopBilling.controller;

import com.BillingSystem.TyreShopBilling.service.InvoiceNumberService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class InvoiceNumberController {

    private InvoiceNumberService invoiceService;

    // To update invoice number whenever wanted
    @PutMapping("/order/invoice/{invoiceNumber}")
    public ResponseEntity<?> updateInvoiceNumber(@PathVariable int invoiceNumber){
        invoiceService.updateInvoiceNumber(invoiceNumber);
        return new ResponseEntity<>(HttpStatus.OK);
    }

    @Autowired
    public void setInvoiceService(InvoiceNumberService invoiceService){
        this.invoiceService = invoiceService;
    }
}
