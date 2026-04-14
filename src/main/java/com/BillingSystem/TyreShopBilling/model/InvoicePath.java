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
public class InvoicePath {
    @Id
    private int id;
    private String folder;

    public InvoicePath(int i) {
        this.id=i;
    }
}
