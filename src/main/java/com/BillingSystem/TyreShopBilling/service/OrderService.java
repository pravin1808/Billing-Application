package com.BillingSystem.TyreShopBilling.service;

import com.BillingSystem.TyreShopBilling.model.OrderedProducts;
import com.BillingSystem.TyreShopBilling.model.Orders;
import com.BillingSystem.TyreShopBilling.model.dto.OrderedProductRequest;
import com.BillingSystem.TyreShopBilling.model.dto.OrderedProductResponse;
import com.BillingSystem.TyreShopBilling.model.dto.OrdersRequest;
import com.BillingSystem.TyreShopBilling.model.dto.OrdersResponse;
import com.BillingSystem.TyreShopBilling.repository.OrderRepo;
import org.jspecify.annotations.NonNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class OrderService {

    private OrderRepo orderRepo;

    public List<OrdersResponse> getAllOrders() {
        List<Orders> allOrders =  orderRepo.findAll();

        List<OrdersResponse> ordersResponses = new ArrayList<>();

        for(Orders order : allOrders){
            List<OrderedProductResponse> orderedProductResponses = getOrderedProductResponses(order);
            OrdersResponse ordersResponse = new OrdersResponse(
                    order.getCustomerName(),
                    order.getCustomerMobileNumber(),
                    order.getGstInNumber(),
                    order.getOrderDate(),
                    order.getTotalAmount(),
                    orderedProductResponses
            );
            ordersResponses.add(ordersResponse);
        }

        return ordersResponses;
    }

    public ResponseEntity<OrdersResponse> getOrderById(long orderId){
        Orders order = orderRepo.findById(orderId).orElse(new Orders(-1));
        if(order.getOrderId()<0){
            System.out.println(1);
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        System.out.println(2);

        List<OrderedProductResponse> orderedProductResponses = getOrderedProductResponses(order);

        OrdersResponse ordersResponse = new OrdersResponse(
                order.getCustomerName(),
                order.getCustomerMobileNumber(),
                order.getGstInNumber(),
                order.getOrderDate(),
                order.getTotalAmount(),
                orderedProductResponses
        );
        return new ResponseEntity<>(ordersResponse, HttpStatus.FOUND);
    }

    public OrdersResponse addNewOrder(OrdersRequest newOrderReq) {
        Orders newOrder = new Orders();
        newOrder.setCustomerName(newOrderReq.customerName());
        newOrder.setCustomerMobileNumber(newOrderReq.customerMobileNumber());
        newOrder.setGstInNumber(newOrderReq.gstInNumber());
        newOrder.setOrderDate(LocalDateTime.now());

        float totalAmount = 0f;
        List<OrderedProducts> orderedProducts = new ArrayList<>();

        for(OrderedProductRequest item : newOrderReq.orderedProducts()){
            OrderedProducts orderedProduct = getOrderedProducts(item, newOrder);

            totalAmount += orderedProduct.getAmount();

            orderedProducts.add(orderedProduct);
        }
        newOrder.setTotalAmount(totalAmount);
        newOrder.setOrderedProducts(orderedProducts);

        Orders addedOrder = orderRepo.save(newOrder);

        List<OrderedProductResponse> orderedProductResponses = getOrderedProductResponses(newOrder);

        OrdersResponse ordersResponse = new OrdersResponse(
                addedOrder.getCustomerName(),
                addedOrder.getCustomerMobileNumber(),
                addedOrder.getGstInNumber(),
                addedOrder.getOrderDate(),
                addedOrder.getTotalAmount(),
                orderedProductResponses

        );

        return ordersResponse;
    }

    private static @NonNull List<OrderedProductResponse> getOrderedProductResponses(Orders newOrder) {
        List<OrderedProductResponse> orderedProductResponses = new ArrayList<>();

        for(OrderedProducts product : newOrder.getOrderedProducts()){
            OrderedProductResponse orderedProductResponse = new OrderedProductResponse(
                    product.getDescription(),
                    product.getSize(),
                    product.getGst(),
                    product.getPrice(),
                    product.getGstPrice(),
                    product.getQuantitySell(),
                    product.getAmount()
            );

            orderedProductResponses.add(orderedProductResponse);
        }
        return orderedProductResponses;
    }

    private static @NonNull OrderedProducts getOrderedProducts(OrderedProductRequest item, Orders newOrder) {
        OrderedProducts orderedProduct = new OrderedProducts();

        orderedProduct.setDescription(item.description());
        orderedProduct.setSize(item.size());
        orderedProduct.setGst(item.gst());
        orderedProduct.setGstPrice(item.gstPrice());
        orderedProduct.setPrice((100.0f * orderedProduct.getGstPrice())/(100.0f + orderedProduct.getGst()));
        orderedProduct.setQuantitySell(item.quantitySell());
        orderedProduct.setAmount(orderedProduct.getGstPrice() * orderedProduct.getQuantitySell());

        orderedProduct.setOrders(newOrder);
        return orderedProduct;
    }

    public ResponseEntity<OrdersResponse> updateOrder(long orderId, OrdersRequest updatedOrder){
        Orders existingOrder = orderRepo.findById(orderId).orElse(new Orders(-1));
        if(existingOrder.getOrderId()<0){
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }

        existingOrder.setCustomerName(updatedOrder.customerName());
        existingOrder.setCustomerMobileNumber(updatedOrder.customerMobileNumber());
        existingOrder.setGstInNumber(updatedOrder.gstInNumber());
        existingOrder.setOrderDate(LocalDateTime.now());

        float totalAmount = 0f;
        List<OrderedProducts> orderedProducts = new ArrayList<>();

        for(OrderedProductRequest item : updatedOrder.orderedProducts()){
            OrderedProducts orderedProduct = getOrderedProducts(item, existingOrder);

            totalAmount += orderedProduct.getAmount();

            orderedProducts.add(orderedProduct);
        }
        existingOrder.setTotalAmount(totalAmount);
        existingOrder.setOrderedProducts(orderedProducts);

        Orders updatedOrder1 = orderRepo.save(existingOrder);

        List<OrderedProductResponse> orderedProductResponses = getOrderedProductResponses(updatedOrder1);

        OrdersResponse ordersResponse = new OrdersResponse(
                updatedOrder1.getCustomerName(),
                updatedOrder1.getCustomerMobileNumber(),
                updatedOrder1.getGstInNumber(),
                updatedOrder1.getOrderDate(),
                updatedOrder1.getTotalAmount(),
                orderedProductResponses

        );

        return new ResponseEntity<>(ordersResponse, HttpStatus.OK);
    }

    public boolean deleteOrderById(long orderId){
        Orders order = orderRepo.findById(orderId).orElse(new Orders(-1));
        if(order.getOrderId()<0){
            return false;
        }else{
            orderRepo.deleteById(order.getOrderId());
            return true;
        }
    }

    @Autowired
    public void setOrderRepo(OrderRepo newOrderRepo){
        this.orderRepo = newOrderRepo;
    }

}
