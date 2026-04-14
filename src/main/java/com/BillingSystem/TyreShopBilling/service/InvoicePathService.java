package com.BillingSystem.TyreShopBilling.service;

import com.BillingSystem.TyreShopBilling.model.InvoicePath;
import com.BillingSystem.TyreShopBilling.repository.InvoicePathRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class InvoicePathService {

    private InvoicePathRepo invoicePathRepo;

    public String isEmpty(){
        if(invoicePathRepo.count()==0){
            InvoicePath invoicePath = new InvoicePath(1,"C:/Invoices");
            invoicePathRepo.save(invoicePath);
            return invoicePath.getFolder();
        }else{
            InvoicePath invoicePath = invoicePathRepo.findById(1).orElse(new InvoicePath(-1));
            return invoicePath.getFolder();
        }
    }

    public boolean changeInvoicePathFolder(String invoicePath){
        InvoicePath invoicePath1 = invoicePathRepo.findById(1).orElse(new InvoicePath(-1));
        invoicePath1.setFolder(invoicePath);
        invoicePathRepo.save(invoicePath1);
        return true;
    }

    @Autowired
    public void setInvoicePathRepo(InvoicePathRepo invoicePathRepo){
        this.invoicePathRepo = invoicePathRepo;
    }
}
