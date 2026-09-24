package com.BillingSystem.TyreShopBilling.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class GstNumber {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer gstId;

    private Integer gst;
}
