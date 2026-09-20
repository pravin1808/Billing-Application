package com.BillingSystem.TyreShopBilling.controller;

import com.BillingSystem.TyreShopBilling.model.dto.OrdersRequest;
import com.BillingSystem.TyreShopBilling.model.dto.OrdersResponse;
import com.BillingSystem.TyreShopBilling.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class OrderController {

    private OrderService orderService;

    @GetMapping("/orders")
    public ResponseEntity<List<OrdersResponse>> getAllOrders() {
        return ResponseEntity.ok(orderService.getAllOrders());
    }

    @GetMapping("/order/{orderId}")
    public ResponseEntity<OrdersResponse> getOrderById(@PathVariable long orderId) {
        // ResourceNotFoundException thrown by service → handled by GlobalExceptionHandler
        return ResponseEntity.ok(orderService.getOrderById(orderId));
    }

    @PostMapping("/order")
    public ResponseEntity<OrdersResponse> addOrder(@RequestBody OrdersRequest newOrderRequest) {
        // InsufficientStockException, InvoiceGenerationException → handled by GlobalExceptionHandler
        return ResponseEntity.status(HttpStatus.CREATED).body(orderService.addNewOrder(newOrderRequest));
    }

    @PutMapping("/order/{orderId}")
    public ResponseEntity<OrdersResponse> updateOrder(
            @PathVariable long orderId,
            @RequestBody OrdersRequest updatedOrder) {
        // ResourceNotFoundException, InvoiceGenerationException → handled by GlobalExceptionHandler
        return ResponseEntity.ok(orderService.updateOrder(orderId, updatedOrder));
    }

    @DeleteMapping("/order/{orderId}")
    public ResponseEntity<Void> deleteOrderById(@PathVariable long orderId) {
        // ResourceNotFoundException thrown by service → handled by GlobalExceptionHandler
        orderService.deleteOrderById(orderId);
        return ResponseEntity.noContent().build();
    }

    @Autowired
    public void setOrderService(OrderService orderService) {
        this.orderService = orderService;
    }
}
