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
        Optional<InvoicePath> invoice = invoicePathRepo.findById(1);
        if (invoice.isPresent() && invoice.get().getFolder() != null && !invoice.get().getFolder().isBlank()) {
            return invoice.get().getFolder();
        }
        InvoicePath invoicePath = new InvoicePath(1, "C:/Invoices");
        invoicePathRepo.save(invoicePath);
        return invoicePath.getFolder();
    }

    public String getInvoicePath() {
        return isEmpty();
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
