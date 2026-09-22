package com.BillingSystem.TyreShopBilling.controller;

import com.BillingSystem.TyreShopBilling.exception.InvoiceGenerationException;
import com.BillingSystem.TyreShopBilling.model.dto.OrderCustomerUpdateRequest;
import com.BillingSystem.TyreShopBilling.model.dto.OrderProductsUpdateRequest;
import com.BillingSystem.TyreShopBilling.model.dto.OrdersRequest;
import com.BillingSystem.TyreShopBilling.model.dto.PageResponse;
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
    public ResponseEntity<List<OrdersResponse>> getAllOrders() {
        return ResponseEntity.ok(orderService.getAllOrders());
    }

    @GetMapping("/orders/paged")
    public ResponseEntity<PageResponse<OrdersResponse>> getOrdersPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "orderId") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(orderService.getOrdersPaged(page, size, sortBy, sortDir, search));
    }

    @GetMapping("/order/{orderId}")
    public ResponseEntity<OrdersResponse> getOrderById(@PathVariable long orderId) {
        return ResponseEntity.ok(orderService.getOrderById(orderId));
    }

    @PostMapping("/order")
    public ResponseEntity<OrdersResponse> addOrder(@Valid @RequestBody OrdersRequest newOrderRequest) {
        OrdersResponse addedOrdersResponse = orderService.addNewOrder(newOrderRequest);
        String pdfPath = orderService.generateInvoicePDF(addedOrdersResponse);
        OrdersResponse savedOrdersResponse = orderService.savePDFPath(addedOrdersResponse.orderId(), pdfPath);
        try {
            orderService.printOrderInvoice(savedOrdersResponse.orderId());
        } catch (Exception e) {
            throw new InvoiceGenerationException(
                    "Order #" + savedOrdersResponse.orderId()
                            + " was saved and PDF created, but sending to printer failed: " + e.getMessage(), e
            );
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(savedOrdersResponse);
    }

    @PutMapping("/order/{orderId}")
    public ResponseEntity<OrdersResponse> updateOrder(
            @PathVariable long orderId,
            @Valid @RequestBody OrderProductsUpdateRequest updatedOrder) {
        OrdersResponse updatedOrdersResponse = orderService.updateOrder(orderId, updatedOrder);
        OrdersResponse savedOrdersResponse = orderService.updateInvoice(updatedOrdersResponse);
        return ResponseEntity.ok(savedOrdersResponse);
    }

    @PutMapping("/order/{orderId}/customer")
    public ResponseEntity<OrdersResponse> updateOrderCustomer(
            @PathVariable long orderId,
            @Valid @RequestBody OrderCustomerUpdateRequest customerUpdateRequest) {
        OrdersResponse updatedOrdersResponse = orderService.updateOrderCustomerDetails(orderId, customerUpdateRequest);
        OrdersResponse savedOrdersResponse = orderService.updateInvoice(updatedOrdersResponse);
        return ResponseEntity.ok(savedOrdersResponse);
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
