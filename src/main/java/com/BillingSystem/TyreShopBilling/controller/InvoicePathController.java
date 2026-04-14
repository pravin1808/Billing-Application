package com.BillingSystem.TyreShopBilling.controller;

import com.BillingSystem.TyreShopBilling.model.dto.InvoicePathRequest;
import com.BillingSystem.TyreShopBilling.service.InvoicePathService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class InvoicePathController {

    private InvoicePathService invoicePathService;

    @PutMapping("/order/invoicePath")
    public boolean updateInvoiceNumber(@RequestBody InvoicePathRequest newInvoicePath){
        return invoicePathService.changeInvoicePathFolder(newInvoicePath.invoicePath());
    }

    @Autowired
    public void setInvoicePathService(InvoicePathService invoicePathService){
        this.invoicePathService=invoicePathService;
    }
}
