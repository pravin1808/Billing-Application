package com.BillingSystem.TyreShopBilling.service;

import com.BillingSystem.TyreShopBilling.model.InvoiceNumber;
import com.BillingSystem.TyreShopBilling.repository.InvoiceNumberRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class InvoiceNumberService {

    private InvoiceNumberRepo invoiceNumberRepo;

    public void updateInvoiceNumber(int invoiceNumber) {
        invoiceNumberRepo.updateInvoiceNumber(invoiceNumber);
    }

    public void isEmpty(){
        if(invoiceNumberRepo.count()==0){
            InvoiceNumber invoiceNumber = new InvoiceNumber(1,1);
            invoiceNumberRepo.save(invoiceNumber);
        }else{
            return;
        }
    }

    public int getCurrentInvoiceNumber(){
        InvoiceNumber gotInvoiceNumber = invoiceNumberRepo.findById(1).orElse(new InvoiceNumber(-1));
        gotInvoiceNumber.setInvoiceNumber(gotInvoiceNumber.getInvoiceNumber()+1);
        invoiceNumberRepo.save(gotInvoiceNumber);
        return gotInvoiceNumber.getInvoiceNumber()-1;
    }

    @Autowired
    public void setInvoiceNumberRepo(InvoiceNumberRepo invoiceNumberRepo){
        this.invoiceNumberRepo = invoiceNumberRepo;
    }
}
