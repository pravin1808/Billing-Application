package com.BillingSystem.TyreShopBilling.controller;

import com.BillingSystem.TyreShopBilling.model.dto.PageResponse;
import com.BillingSystem.TyreShopBilling.model.dto.OrdersRequest;
import com.BillingSystem.TyreShopBilling.model.dto.OrdersResponse;
import com.BillingSystem.TyreShopBilling.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class OrderController {

    private OrderService orderService;

    @GetMapping("/orders")
    public ResponseEntity<?> getOrders(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(defaultValue = "orderId") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        if (page != null || size != null) {
            int p = (page != null) ? page : 0;
            int s = (size != null) ? size : 10;
            return ResponseEntity.ok(orderService.getOrdersPaged(p, s, sortBy, sortDir));
        }
        return ResponseEntity.ok(orderService.getAllOrders());
    }

    @GetMapping("/orders/paged")
    public ResponseEntity<PageResponse<OrdersResponse>> getOrdersPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "orderId") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        return ResponseEntity.ok(orderService.getOrdersPaged(page, size, sortBy, sortDir));
    }

    @GetMapping("/order/{orderId}")
    public ResponseEntity<OrdersResponse> getOrderById(@PathVariable long orderId) {
        return ResponseEntity.ok(orderService.getOrderById(orderId));
    }

    @PostMapping("/order")
    public ResponseEntity<OrdersResponse> addOrder(@Valid @RequestBody OrdersRequest newOrderRequest) {
        return ResponseEntity.status(HttpStatus.CREATED).body(orderService.addNewOrder(newOrderRequest));
    }

    @PutMapping("/order/{orderId}")
    public ResponseEntity<OrdersResponse> updateOrder(
            @PathVariable long orderId,
            @Valid @RequestBody OrdersRequest updatedOrder) {
        return ResponseEntity.ok(orderService.updateOrder(orderId, updatedOrder));
    }

    @DeleteMapping("/order/{orderId}")
    public ResponseEntity<Void> deleteOrderById(@PathVariable long orderId) {
        orderService.deleteOrderById(orderId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/order/{orderId}/invoice")
    public ResponseEntity<byte[]> getInvoicePdf(@PathVariable long orderId) {
        byte[] pdf = orderService.getInvoicePdf(orderId);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("inline", "invoice-" + orderId + ".pdf");
        return new ResponseEntity<>(pdf, headers, HttpStatus.OK);
    }

    @PostMapping("/order/{orderId}/invoice/print")
    public ResponseEntity<String> printInvoice(@PathVariable long orderId) {
        orderService.printOrderInvoice(orderId);
        return ResponseEntity.ok("Invoice for order #" + orderId + " sent to printer successfully.");
    }

    @Autowired
    public void setOrderService(OrderService orderService) {
        this.orderService = orderService;
    }
}
