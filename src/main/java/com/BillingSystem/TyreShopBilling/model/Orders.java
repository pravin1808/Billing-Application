package com.BillingSystem.TyreShopBilling.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
public class Orders {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long orderId;
    private int invoiceNumber;
    private String customerName;
    private long customerMobileNumber;
    private String gstInNumber;
    private LocalDateTime orderDate;
    private float totalAmount;
    private String paymentMethod;

    @OneToMany(mappedBy = "orders", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderedProducts> orderedProducts;

    public Orders(int orderId) {
        this.orderId = orderId;
    }
}
