package com.BillingSystem.TyreShopBilling.model;

import com.fasterxml.jackson.annotation.JsonFormat;
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
    private String customerName;
    private long customerMobileNumber;
    private String gstInNumber;
    @JsonFormat(pattern = "dd-MM-yyyy hh:mm a")
    private LocalDateTime orderDate;
    private float totalAmount;

    @OneToMany(mappedBy = "orders", cascade = CascadeType.ALL)
    private List<OrderedProducts> orderedProducts;

    public Orders(int orderId) {
        this.orderId = orderId;
    }
}
