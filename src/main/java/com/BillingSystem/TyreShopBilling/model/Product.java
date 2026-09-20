package com.BillingSystem.TyreShopBilling.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;


@Getter
@Setter
@Entity
@Table(name = "products")
@AllArgsConstructor
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "product_id")
    private Integer productId;
    private String description;
    private String size;
    private Integer hsnNumber;
    private Integer gst;
    private Integer quantity;

    public Integer getProduct_id() {
        return productId;
    }

    public void setProduct_id(Integer productId) {
        this.productId = productId;
    }

    @Setter
    @Transient
    private Integer quantity_To_Sell;
    @Setter
    @Transient
    private Float rate;
    @Transient
    private Float rate_gst;
    @Setter
    @Transient
    private Float amount;


    public Product(String description, Integer quantityToSell) {
        this.description = description;
        this.quantity_To_Sell = quantityToSell;
    }

    public Product(String description, String size){
        this.description = description;
        this.size = size;
    }

    public Product() {

    }

    public Product(int productId) {
        this.productId = productId;
    }


    @Override
    public String toString(){
        return description;
    }

    public Product(String description, String size, Integer HSN_Number, Integer GST, Integer quantity, Integer productId){
        this.description = description;
        this.size = size;
        this.hsnNumber = HSN_Number;
        this.gst = GST;
        this.quantity = quantity;
        this.productId = productId;
    }

    public Product(String description) {
        this.description = description;
    }

    public Product(String description, String size, Integer HSN_Number, Integer GST) {
        this.description = description;
        this.size = size;
        this.hsnNumber = HSN_Number;
        this.gst = GST;
    }

    public Product(String desc, String size, Integer hsn, Integer gst, Float rate, Float rateGst, Integer quantity1, Float amount) {
        this.description = desc;
        this.size = size;
        this.hsnNumber = hsn;
        this.gst = gst;
        this.rate = rate;
        this.rate_gst = rateGst;
        this.quantity_To_Sell = quantity1;
        this.amount = amount;
    }


    public void setRate_GST(Float rateGst) {
        this.rate_gst = rateGst;
    }

}


