package com.BillingSystem.TyreShopBilling.service;

import com.BillingSystem.TyreShopBilling.exception.InvalidRequestException;
import com.BillingSystem.TyreShopBilling.model.InvoicePath;
import com.BillingSystem.TyreShopBilling.repository.InvoicePathRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class InvoicePathService {

    private InvoicePathRepo invoicePathRepo;

    public String isEmpty() {
        if (invoicePathRepo.count() == 0) {
            InvoicePath invoicePath = new InvoicePath(1, "C:/Invoices");
            invoicePathRepo.save(invoicePath);
            return invoicePath.getFolder();
        } else {
            InvoicePath invoicePath = invoicePathRepo.findById(1)
                    .orElseThrow(() -> new InvalidRequestException(
                            "Invoice path configuration is missing. Please set the invoice folder path via PUT /api/order/invoicePath."
                    ));
            return invoicePath.getFolder();
        }
    }

    public void changeInvoicePathFolder(String newPath) {
        Optional<InvoicePath> invoice = invoicePathRepo.findById(1);
        if(invoice.isPresent()){
            InvoicePath invoicePath = invoice.get();
            invoicePath.setFolder(newPath);
            invoicePathRepo.save(invoicePath);
            return;
        }
        InvoicePath newInvoicePath = new InvoicePath(
                1,
                newPath
        );
        invoicePathRepo.save(newInvoicePath);
    }

    @Autowired
    public void setInvoicePathRepo(InvoicePathRepo invoicePathRepo) {
        this.invoicePathRepo = invoicePathRepo;
    }
}
