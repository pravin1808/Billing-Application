package com.BillingSystem.TyreShopBilling.service;

import com.BillingSystem.TyreShopBilling.InvoiceGenerator;
import com.BillingSystem.TyreShopBilling.exception.InvoiceGenerationException;
import com.BillingSystem.TyreShopBilling.exception.ResourceNotFoundException;
import com.BillingSystem.TyreShopBilling.model.OrderedProducts;
import com.BillingSystem.TyreShopBilling.model.Orders;
import com.BillingSystem.TyreShopBilling.model.dto.PageResponse;
import com.BillingSystem.TyreShopBilling.model.dto.OrderedProductRequest;
import com.BillingSystem.TyreShopBilling.model.dto.OrderedProductResponse;
import com.BillingSystem.TyreShopBilling.model.dto.OrdersRequest;
import com.BillingSystem.TyreShopBilling.model.dto.OrdersResponse;
import com.BillingSystem.TyreShopBilling.model.Product;
import com.BillingSystem.TyreShopBilling.repository.OrderRepo;
import com.BillingSystem.TyreShopBilling.repository.ProductRepo;
import org.jspecify.annotations.NonNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
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
    private ProductRepo productRepo;

    public List<OrdersResponse> getAllOrders() {
        List<Orders> allOrders = orderRepo.findAll(Sort.by(Sort.Direction.ASC, "orderId"));

        List<OrdersResponse> ordersResponses = new ArrayList<>();

        for (Orders order : allOrders) {
            List<OrderedProductResponse> orderedProductResponses = getOrderedProductResponses(order);
            ordersResponses.add(new OrdersResponse(
                    order.getOrderId(),
                    order.getCustomerName(),
                    order.getCustomerMobileNumber(),
                    order.getGstInNumber(),
                    order.getInvoiceNumber(),
                    order.getInvoicePath(),
                    order.getOrderDate(),
                    order.getTotalAmount(),
                    order.getPaymentMethod(),
                    orderedProductResponses
            ));
        }

        return ordersResponses;
    }

    public PageResponse<OrdersResponse> getOrdersPaged(int page, int size, String sortBy, String sortDir, String search) {
        String safeSortBy = (sortBy == null || sortBy.isBlank()) ? "orderDate" : sortBy;
        Sort sort = "asc".equalsIgnoreCase(sortDir)
                ? Sort.by(safeSortBy).ascending()
                : Sort.by(safeSortBy).descending();
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size), sort);

        Page<Orders> ordersPage;

        if(search == null || search.isBlank()){
            ordersPage = orderRepo.findAll(pageable);
        }else{
            ordersPage = orderRepo.searchOrders(search.trim(), pageable);
        }

        Page<OrdersResponse> responsePage = ordersPage.map(order -> {
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
                    orderedProductResponses
            );
        });

        return PageResponse.from(responsePage);
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
                order.getInvoicePath(),
                order.getOrderDate(),
                order.getTotalAmount(),
                order.getPaymentMethod(),
                orderedProductResponses
        );
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

        for (OrderedProductRequest item : newOrderReq.orderedProducts()) {
            OrderedProducts orderedProduct = getOrderedProducts(item, newOrder);
            totalAmount += orderedProduct.getAmount();
            orderedProducts.add(orderedProduct);
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
            } else {
                productService.validateStock(
                        orderedProduct.getDescription(),
                        orderedProduct.getSize(),
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
            } else {
                productService.updateStock(
                        orderedProduct.getDescription(),
                        orderedProduct.getSize(),
                        orderedProduct.getQuantitySell()
                );
            }
        }

        Orders addedOrder = orderRepo.save(newOrder);

        List<OrderedProductResponse> orderedProductResponses = getOrderedProductResponses(addedOrder);

        return new OrdersResponse(
                addedOrder.getOrderId(),
                addedOrder.getCustomerName(),
                addedOrder.getCustomerMobileNumber(),
                addedOrder.getGstInNumber(),
                addedOrder.getInvoiceNumber(),
                null,
                addedOrder.getOrderDate(),
                addedOrder.getTotalAmount(),
                addedOrder.getPaymentMethod(),
                orderedProductResponses
        );
    }

    public String generateInvoicePDF(OrdersResponse ordersResponse){
        String folder = invoicePathService.isEmpty();
        String pdfPath = null;
        try {
            pdfPath = invoiceGenerator.invoiceGenerator(ordersResponse, folder);
        } catch (Exception e) {
            throw new InvoiceGenerationException(
                    "Failed to generate invoice for order #" + ordersResponse.invoiceNumber()
                            + ". The order was saved but the invoice could not be created.", e
            );
        }
        return pdfPath;
    }

    public OrdersResponse savePDFPath(Long orderId, String pdfPath){
        Orders order = orderRepo.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));
        order.setInvoicePath(pdfPath);
        Orders savedOrder = orderRepo.save(order);
        List<OrderedProductResponse> orderedProductResponses = getOrderedProductResponses(savedOrder);
        return new OrdersResponse(
                savedOrder.getOrderId(),
                savedOrder.getCustomerName(),
                savedOrder.getCustomerMobileNumber(),
                savedOrder.getGstInNumber(),
                savedOrder.getInvoiceNumber(),
                savedOrder.getInvoicePath(),
                savedOrder.getOrderDate(),
                savedOrder.getTotalAmount(),
                savedOrder.getPaymentMethod(),
                orderedProductResponses
        );
    }

    public OrdersResponse updateOrder(long orderId, OrdersRequest updatedOrderReq) {
        Orders existingOrder = orderRepo.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));



        float totalAmount = 0f;

        for (OrderedProductRequest item : updatedOrderReq.orderedProducts()) {
            OrderedProducts orderedProduct = getOrderedProducts(item, existingOrder);
            totalAmount += orderedProduct.getAmount();
            existingOrder.getOrderedProducts().add(orderedProduct);
        }
        existingOrder.setTotalAmount(totalAmount);

        Orders savedOrder = orderRepo.save(existingOrder);

        List<OrderedProductResponse> orderedProductResponses = getOrderedProductResponses(savedOrder);

        String folder = invoicePathService.isEmpty();

        try {
            String pdfPath = invoiceGenerator.invoiceGenerator(new OrdersResponse(
                    savedOrder.getOrderId(),
                    savedOrder.getCustomerName(),
                    savedOrder.getCustomerMobileNumber(),
                    savedOrder.getGstInNumber(),
                    savedOrder.getInvoiceNumber(),
                    null,
                    savedOrder.getOrderDate(),
                    savedOrder.getTotalAmount(),
                    savedOrder.getPaymentMethod(),
                    orderedProductResponses
            ), folder);

            savedOrder.setInvoicePath(pdfPath);
            orderRepo.save(savedOrder);

            return new OrdersResponse(
                    savedOrder.getOrderId(),
                    savedOrder.getCustomerName(),
                    savedOrder.getCustomerMobileNumber(),
                    savedOrder.getGstInNumber(),
                    savedOrder.getInvoiceNumber(),
                    pdfPath,
                    savedOrder.getOrderDate(),
                    savedOrder.getTotalAmount(),
                    savedOrder.getPaymentMethod(),
                    orderedProductResponses
            );
        } catch (Exception e) {
            throw new InvoiceGenerationException(
                    "Order #" + savedOrder.getOrderId() + " was updated but the invoice could not be regenerated.", e
            );
        }
    }

    public void deleteOrderById(long orderId) {
        Orders order = orderRepo.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));
        orderRepo.deleteById(order.getOrderId());
    }

    public void printOrderInvoice(long orderId) {
        Orders order = orderRepo.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        String path = order.getInvoicePath();
        if (path == null || path.isBlank()) {
            throw new ResourceNotFoundException("Invoice PDF for order", "id", orderId);
        }

        try {
            InvoiceGenerator.printInvoice(path);
        } catch (Exception e) {
            throw new InvoiceGenerationException(
                    "Failed to send invoice for order #" + orderId + " to printer.", e
            );
        }
    }

    public byte[] getInvoicePdf(long orderId) {
        Orders order = orderRepo.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        String path = order.getInvoicePath();
        if (path == null || path.isBlank()) {
            throw new ResourceNotFoundException("Invoice PDF for order", "id", orderId);
        }

        try {
            return Files.readAllBytes(Path.of(path));
        } catch (IOException e) {
            throw new InvoiceGenerationException(
                    "Invoice file for order #" + orderId + " could not be read from disk.", e
            );
        }
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
            Product product = productRepo.findById(item.productId()).orElse(null);
            orderedProduct.setProduct(product);
        } else if (item.description() != null && item.size() != null && productRepo != null) {
            productRepo.findByDescriptionAndSize(item.description(), item.size())
                    .ifPresent(orderedProduct::setProduct);
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
