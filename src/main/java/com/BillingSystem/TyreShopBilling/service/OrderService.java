package com.BillingSystem.TyreShopBilling.service;

import com.BillingSystem.TyreShopBilling.InvoiceGenerator;
import com.BillingSystem.TyreShopBilling.exception.InvoiceGenerationException;
import com.BillingSystem.TyreShopBilling.exception.ResourceNotFoundException;
import com.BillingSystem.TyreShopBilling.model.OrderedProducts;
import com.BillingSystem.TyreShopBilling.model.Orders;
import com.BillingSystem.TyreShopBilling.model.dto.OrderedProductRequest;
import com.BillingSystem.TyreShopBilling.model.dto.OrderedProductResponse;
import com.BillingSystem.TyreShopBilling.model.dto.OrdersRequest;
import com.BillingSystem.TyreShopBilling.model.dto.OrdersResponse;
import com.BillingSystem.TyreShopBilling.repository.OrderRepo;
import org.jspecify.annotations.NonNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class OrderService {

    private OrderRepo orderRepo;
    private InvoiceNumberService invoiceNumberService;
    private InvoicePathService invoicePathService;
    private InvoiceGenerator invoiceGenerator;
    private ProductService productService;

    public List<OrdersResponse> getAllOrders() {
        List<Orders> allOrders = orderRepo.findAll(Sort.by(Sort.Direction.ASC, "orderId"));

        List<OrdersResponse> ordersResponses = new ArrayList<>();

        for (Orders order : allOrders) {
            List<OrderedProductResponse> orderedProductResponses = getOrderedProductResponses(order);
            OrdersResponse ordersResponse = new OrdersResponse(
                    order.getOrderId(),
                    order.getCustomerName(),
                    order.getCustomerMobileNumber(),
                    order.getGstInNumber(),
                    order.getInvoiceNumber(),
                    order.getOrderDate(),
                    order.getTotalAmount(),
                    order.getPaymentMethod(),
                    orderedProductResponses
            );
            ordersResponses.add(ordersResponse);
        }

        return ordersResponses;
    }

    public OrdersResponse getOrderById(long orderId) {
        Orders order = orderRepo.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        List<OrderedProductResponse> orderedProductResponses = getOrderedProductResponses(order);

        return new OrdersResponse(
                order.getOrderId(),
                order.getCustomerName(),
                order.getCustomerMobileNumber(),
                order.getGstInNumber(),
                order.getInvoiceNumber(),
                order.getOrderDate(),
                order.getTotalAmount(),
                order.getPaymentMethod(),
                orderedProductResponses
        );
    }

    public OrdersResponse addNewOrder(OrdersRequest newOrderReq) {
        Orders newOrder = new Orders();
        newOrder.setCustomerName(newOrderReq.customerName());
        newOrder.setCustomerMobileNumber(newOrderReq.customerMobileNumber());
        newOrder.setGstInNumber(newOrderReq.gstInNumber());
        newOrder.setOrderDate(LocalDateTime.now());

        invoiceNumberService.isEmpty();
        String folder = invoicePathService.isEmpty();

        newOrder.setInvoiceNumber(invoiceNumberService.getCurrentInvoiceNumber());

        float totalAmount = 0f;
        List<OrderedProducts> orderedProducts = new ArrayList<>();

        for (OrderedProductRequest item : newOrderReq.orderedProducts()) {
            OrderedProducts orderedProduct = getOrderedProducts(item, newOrder);
            totalAmount += orderedProduct.getAmount();
            orderedProducts.add(orderedProduct);
        }

        newOrder.setTotalAmount(totalAmount);
        newOrder.setPaymentMethod(newOrderReq.paymentMethod());
        newOrder.setOrderedProducts(orderedProducts);

        // Validate stock for all items before committing any changes
        for (OrderedProducts orderedProduct : orderedProducts) {
            productService.validateStock(
                    orderedProduct.getDescription(),
                    orderedProduct.getSize(),
                    orderedProduct.getQuantitySell()
            );
        }

        // Deduct stock only after all validations pass
        for (OrderedProducts orderedProduct : orderedProducts) {
            productService.updateStock(
                    orderedProduct.getDescription(),
                    orderedProduct.getSize(),
                    orderedProduct.getQuantitySell()
            );
        }

        Orders addedOrder = orderRepo.save(newOrder);

        List<OrderedProductResponse> orderedProductResponses = getOrderedProductResponses(addedOrder);

        OrdersResponse ordersResponse = new OrdersResponse(
                addedOrder.getOrderId(),
                addedOrder.getCustomerName(),
                addedOrder.getCustomerMobileNumber(),
                addedOrder.getGstInNumber(),
                addedOrder.getInvoiceNumber(),
                addedOrder.getOrderDate(),
                addedOrder.getTotalAmount(),
                addedOrder.getPaymentMethod(),
                orderedProductResponses
        );

        try {
            invoiceGenerator.invoiceGenerator(ordersResponse, folder);
        } catch (IOException e) {
            throw new InvoiceGenerationException(
                    "Failed to generate invoice for order #" + addedOrder.getInvoiceNumber()
                            + ". The order was saved but the invoice could not be created.", e
            );
        }

        return ordersResponse;
    }

    public OrdersResponse updateOrder(long orderId, OrdersRequest updatedOrderReq) {
        Orders existingOrder = orderRepo.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        existingOrder.setCustomerName(updatedOrderReq.customerName());
        existingOrder.setCustomerMobileNumber(updatedOrderReq.customerMobileNumber());
        existingOrder.setGstInNumber(updatedOrderReq.gstInNumber());
        existingOrder.setOrderDate(LocalDateTime.now());
        existingOrder.getOrderedProducts().clear();

        float totalAmount = 0f;

        for (OrderedProductRequest item : updatedOrderReq.orderedProducts()) {
            OrderedProducts orderedProduct = getOrderedProducts(item, existingOrder);
            totalAmount += orderedProduct.getAmount();
            existingOrder.getOrderedProducts().add(orderedProduct);
        }
        existingOrder.setTotalAmount(totalAmount);

        Orders savedOrder = orderRepo.save(existingOrder);

        List<OrderedProductResponse> orderedProductResponses = getOrderedProductResponses(savedOrder);

        OrdersResponse ordersResponse = new OrdersResponse(
                savedOrder.getOrderId(),
                savedOrder.getCustomerName(),
                savedOrder.getCustomerMobileNumber(),
                savedOrder.getGstInNumber(),
                savedOrder.getInvoiceNumber(),
                savedOrder.getOrderDate(),
                savedOrder.getTotalAmount(),
                savedOrder.getPaymentMethod(),
                orderedProductResponses
        );

        String folder = invoicePathService.isEmpty();

        try {
            invoiceGenerator.invoiceGenerator(ordersResponse, folder);
        } catch (IOException e) {
            throw new InvoiceGenerationException(
                    "Order #" + savedOrder.getOrderId() + " was updated but the invoice could not be regenerated.", e
            );
        }

        return ordersResponse;
    }

    public void deleteOrderById(long orderId) {
        Orders order = orderRepo.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));
        orderRepo.deleteById(order.getOrderId());
    }

    private static @NonNull List<OrderedProductResponse> getOrderedProductResponses(Orders order) {
        List<OrderedProductResponse> orderedProductResponses = new ArrayList<>();

        for (OrderedProducts product : order.getOrderedProducts()) {
            orderedProductResponses.add(new OrderedProductResponse(
                    product.getId(),
                    product.getDescription(),
                    product.getSize(),
                    product.getGst(),
                    product.getHsnNumber(),
                    product.getPrice(),
                    product.getGstPrice(),
                    product.getQuantitySell(),
                    product.getAmount()
            ));
        }
        return orderedProductResponses;
    }

    private static @NonNull OrderedProducts getOrderedProducts(OrderedProductRequest item, Orders order) {
        OrderedProducts orderedProduct = new OrderedProducts();

        orderedProduct.setDescription(item.description());
        orderedProduct.setSize(item.size());
        orderedProduct.setHsnNumber(item.hsnNumber());
        orderedProduct.setGst(item.gst());
        orderedProduct.setGstPrice(item.gstPrice());
        orderedProduct.setPrice((100.0f * orderedProduct.getGstPrice()) / (100.0f + orderedProduct.getGst()));
        orderedProduct.setQuantitySell(item.quantitySell());
        orderedProduct.setAmount(orderedProduct.getGstPrice() * orderedProduct.getQuantitySell());
        orderedProduct.setOrders(order);

        return orderedProduct;
    }

    @Autowired
    public void setOrderRepo(OrderRepo newOrderRepo) {
        this.orderRepo = newOrderRepo;
    }

    @Autowired
    public void setInvoiceNumberService(InvoiceNumberService invoiceNumberService) {
        this.invoiceNumberService = invoiceNumberService;
    }

    @Autowired
    public void setInvoicePathService(InvoicePathService invoicePathService) {
        this.invoicePathService = invoicePathService;
    }

    @Autowired
    public void setInvoiceGenerator(InvoiceGenerator invoiceGenerator) {
        this.invoiceGenerator = invoiceGenerator;
    }

    @Autowired
    public void setProductService(ProductService productService) {
        this.productService = productService;
    }
}
