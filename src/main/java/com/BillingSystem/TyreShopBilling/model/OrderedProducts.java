package com.BillingSystem.TyreShopBilling.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
public class OrderedProducts {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;
    private String description;
    private String size;
    private int gst;
    private float price;
    private float gstPrice;
    private int quantitySell;
    private float amount;

    @Getter
    @Setter
    @ManyToOne(fetch = FetchType.LAZY)
    private Orders orders;

}
