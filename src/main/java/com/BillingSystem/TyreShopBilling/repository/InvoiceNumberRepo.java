package com.BillingSystem.TyreShopBilling.repository;

import com.BillingSystem.TyreShopBilling.model.InvoiceNumber;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

public interface InvoiceNumberRepo extends JpaRepository<InvoiceNumber, Integer> {

    @Modifying
    @Transactional
    @Query("UPDATE InvoiceNumber i SET i.invoiceNumber = :invoiceNumber WHERE i.id = 1")
    void updateInvoiceNumber(@Param("invoiceNumber") int invoiceNumber);
}
