package com.BillingSystem.TyreShopBilling.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Entity
public class InvoiceNumber {
    @Id
    private int id;
    private int invoiceNumber;

    public InvoiceNumber(int i) {
        this.id=i;
    }
}
