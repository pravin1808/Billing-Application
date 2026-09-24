package com.BillingSystem.TyreShopBilling.service;

import com.BillingSystem.TyreShopBilling.exception.InvalidRequestException;
import com.BillingSystem.TyreShopBilling.exception.ResourceNotFoundException;
import com.BillingSystem.TyreShopBilling.model.OrderedProducts;
import com.BillingSystem.TyreShopBilling.model.Orders;
import com.BillingSystem.TyreShopBilling.model.dto.*;
import com.BillingSystem.TyreShopBilling.model.Product;
import com.BillingSystem.TyreShopBilling.repository.OrderRepo;
import com.BillingSystem.TyreShopBilling.repository.OrderedProductRepo;
import com.BillingSystem.TyreShopBilling.repository.ProductRepo;
import jakarta.validation.Valid;
import org.jspecify.annotations.NonNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class OrderService {

    private OrderRepo orderRepo;
    private InvoiceNumberService invoiceNumberService;
    private ProductService productService;
    private ProductRepo productRepo;

    public List<OrdersResponse> getAllOrders() {
        List<Orders> allOrders = orderRepo.findAll(Sort.by(Sort.Direction.ASC, "orderId"));

        List<OrdersResponse> ordersResponses = new ArrayList<>();

        for (Orders order : allOrders) {
            ordersResponses.add(toOrdersResponse(order));
        }

        return ordersResponses;
    }

    public List<OrdersResponse> getOrdersByCancelled(boolean isCancelled) {
        List<Orders> ordersList = orderRepo.findByIsCancelled(isCancelled, Sort.by(Sort.Direction.ASC, "orderId"));
        List<OrdersResponse> responses = new ArrayList<>();
        for (Orders order : ordersList) {
            responses.add(toOrdersResponse(order));
        }
        return responses;
    }

    public PageResponse<OrdersResponse> getOrdersPaged(int page, int size, String sortBy, String sortDir, String search) {
        return getOrdersPaged(page, size, sortBy, sortDir, search, false);
    }

    public PageResponse<OrdersResponse> getOrdersPaged(int page, int size, String sortBy, String sortDir, String search, boolean isCancelled) {
        String safeSortBy = (sortBy == null || sortBy.isBlank()) ? "orderDate" : sortBy;
        Sort sort = "asc".equalsIgnoreCase(sortDir)
                ? Sort.by(safeSortBy).ascending()
                : Sort.by(safeSortBy).descending();
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size), sort);

        Page<Orders> ordersPage;

        if (search == null || search.isBlank()) {
            ordersPage = orderRepo.findByIsCancelled(isCancelled, pageable);
        } else {
            ordersPage = orderRepo.searchOrdersByCancelledStatus(search.trim(), isCancelled, pageable);
        }

        Page<OrdersResponse> responsePage = ordersPage.map(this::toOrdersResponse);

        return PageResponse.from(responsePage);
    }

    public OrdersResponse getOrderById(long orderId) {
        Orders order = orderRepo.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        return toOrdersResponse(order);
    }

    @Transactional
    public OrdersResponse addNewOrder(OrdersRequest newOrderReq) {
        Orders newOrder = new Orders();
        newOrder.setCustomerName(newOrderReq.customerName());
        newOrder.setCustomerMobileNumber(newOrderReq.customerMobileNumber());
        newOrder.setGstInNumber(newOrderReq.gstInNumber());
        newOrder.setOrderDate(LocalDateTime.now());

        invoiceNumberService.isEmpty();

        newOrder.setInvoiceNumber(invoiceNumberService.getCurrentInvoiceNumber());

        float totalAmount = 0f;
        List<OrderedProducts> orderedProducts = new ArrayList<>();

        if(newOrderReq.orderedProducts() != null) {
            for (OrderedProductRequest item : newOrderReq.orderedProducts()) {
                OrderedProducts orderedProduct = getOrderedProducts(item, newOrder);
                totalAmount += orderedProduct.getAmount();
                orderedProducts.add(orderedProduct);
            }
        }

        if(newOrderReq.externalOrderedProducts() != null) {
            for (OrderedProductRequest item : newOrderReq.externalOrderedProducts()) {
                OrderedProducts orderedProduct = getOrderedProducts(item, newOrder);
                totalAmount += orderedProduct.getAmount();
                orderedProducts.add(orderedProduct);
            }
        }

        if (orderedProducts.isEmpty()) {
            throw new InvalidRequestException("Order must contain at least one product");
        }

        newOrder.setTotalAmount(totalAmount);
        newOrder.setPaymentMethod(newOrderReq.paymentMethod());
        newOrder.setOrderedProducts(orderedProducts);

        for (OrderedProducts orderedProduct : orderedProducts) {
            if (orderedProduct.getProduct() != null) {
                productService.validateStock(
                        orderedProduct.getProduct(),
                        orderedProduct.getQuantitySell()
                );
            }
        }

        for (OrderedProducts orderedProduct : orderedProducts) {
            if (orderedProduct.getProduct() != null) {
                productService.updateStock(
                        orderedProduct.getProduct(),
                        orderedProduct.getQuantitySell()
                );
            }
        }

        Orders addedOrder = orderRepo.save(newOrder);

        return toOrdersResponse(addedOrder);
    }

    @Transactional
    public OrdersResponse updateOrder(long orderId, @Valid OrderProductsUpdateRequest updatedOrderReq) {
        Orders existingOrder = orderRepo.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        if (existingOrder.isCancelled()) {
            throw new IllegalStateException("Cannot update products of an order that has already been cancelled.");
        }

        for (OrderedProducts oldItem : existingOrder.getOrderedProducts()) {
            if (oldItem.getProduct() != null) {
                productService.restoreStock(oldItem.getProduct(), oldItem.getQuantitySell());
            }
        }
        existingOrder.getOrderedProducts().clear();

        float totalAmount = 0f;
        if(updatedOrderReq.orderedProducts() != null) {
            for (OrderedProductRequest item : updatedOrderReq.orderedProducts()) {
                OrderedProducts orderedProduct = getOrderedProducts(item, existingOrder);
                totalAmount += orderedProduct.getAmount();
                existingOrder.getOrderedProducts().add(orderedProduct);
            }
        }

        if(updatedOrderReq.externalOrderedProducts() != null) {
            for (OrderedProductRequest item : updatedOrderReq.externalOrderedProducts()) {
                OrderedProducts orderedProduct = getOrderedProducts(item, existingOrder);
                totalAmount += orderedProduct.getAmount();
                existingOrder.getOrderedProducts().add(orderedProduct);
            }
        }

        if (existingOrder.getOrderedProducts().isEmpty()) {
            throw new InvalidRequestException("Order must contain at least one product");
        }

        existingOrder.setTotalAmount(totalAmount);

        List<OrderedProducts> orderedProducts = existingOrder.getOrderedProducts();

        for (OrderedProducts orderProduct : orderedProducts) {
            if (orderProduct.getProduct() != null) {
                productService.validateStock(
                        orderProduct.getProduct(),
                        orderProduct.getQuantitySell()
                );
            }
        }

        for (OrderedProducts orderProduct : orderedProducts) {
            if (orderProduct.getProduct() != null) {
                productService.updateStock(
                        orderProduct.getProduct(),
                        orderProduct.getQuantitySell()
                );
            }
        }

        Orders savedOrder = orderRepo.save(existingOrder);
        return toOrdersResponse(savedOrder);
    }

    @Transactional
    public OrdersResponse updateOrderCustomerDetails(long orderId, @Valid OrderCustomerUpdateRequest req) {
        Orders existingOrder = orderRepo.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        if (existingOrder.isCancelled()) {
            throw new IllegalStateException("Cannot update customer details of an order that has already been cancelled.");
        }

        existingOrder.setCustomerName(req.customerName());
        existingOrder.setCustomerMobileNumber(req.customerMobileNumber());
        existingOrder.setGstInNumber(req.gstInNumber());
        existingOrder.setPaymentMethod(req.paymentMethod());

        Orders savedOrder = orderRepo.save(existingOrder);
        return toOrdersResponse(savedOrder);
    }

    @Transactional
    public OrdersResponse cancelOrder(long orderId) {
        Orders existingOrder = orderRepo.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        if (existingOrder.isCancelled()) {
            throw new IllegalStateException("Order #" + orderId + " has already been cancelled.");
        }

        for (OrderedProducts oldItem : existingOrder.getOrderedProducts()) {
            if (oldItem.getProduct() != null) {
                productService.restoreStock(oldItem.getProduct(), oldItem.getQuantitySell());
            }
        }

        existingOrder.setCancelled(true);
        existingOrder.setCancelledAt(LocalDateTime.now());

        Orders savedOrder = orderRepo.save(existingOrder);
        return toOrdersResponse(savedOrder);
    }

    public OrdersResponse toOrdersResponse(Orders order) {
        List<OrderedProductResponse> orderedProductResponses = getOrderedProductResponses(order);
        return new OrdersResponse(
                order.getOrderId(),
                order.getCustomerName(),
                order.getCustomerMobileNumber(),
                order.getGstInNumber(),
                order.getInvoiceNumber(),
                order.getInvoicePath(),
                order.getOrderDate(),
                order.getTotalAmount(),
                order.getPaymentMethod(),
                order.isCancelled(),
                order.getCancelledAt(),
                orderedProductResponses
        );
    }

    private static @NonNull List<OrderedProductResponse> getOrderedProductResponses(Orders order) {
        List<OrderedProductResponse> orderedProductResponses = new ArrayList<>();

        for (OrderedProducts product : order.getOrderedProducts()) {
            orderedProductResponses.add(new OrderedProductResponse(
                    product.getId(),
                    product.getProductId(),
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

    private @NonNull OrderedProducts getOrderedProducts(OrderedProductRequest item, Orders order) {
        OrderedProducts orderedProduct = new OrderedProducts();

        if (item.productId() != null && productRepo != null) {
            Product product = productRepo.findById(item.productId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product", "id", item.productId()));
            orderedProduct.setProduct(product);
        }

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
    public void setProductRepo(ProductRepo productRepo) {
        this.productRepo = productRepo;
    }

    @Autowired
    public void setInvoiceNumberService(InvoiceNumberService invoiceNumberService) {
        this.invoiceNumberService = invoiceNumberService;
    }

    @Autowired
    public void setProductService(ProductService productService) {
        this.productService = productService;
    }

}
