package com.BillingSystem.TyreShopBilling.service;

import com.BillingSystem.TyreShopBilling.InvoiceGenerator;
import com.BillingSystem.TyreShopBilling.exception.InvoiceGenerationException;
import com.BillingSystem.TyreShopBilling.exception.ResourceNotFoundException;
import com.BillingSystem.TyreShopBilling.model.Orders;
import com.BillingSystem.TyreShopBilling.model.dto.OrdersResponse;
import com.BillingSystem.TyreShopBilling.repository.OrderRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

@Service
public class InvoiceService {

    private InvoicePathService invoicePathService;
    private InvoiceGenerator invoiceGenerator;
    private OrderRepo orderRepo;
    private OrderService orderService;

    public String generateInvoicePDF(OrdersResponse ordersResponse) {
        String folder = invoicePathService.isEmpty();
        String pdfPath;
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

    public OrdersResponse savePDFPath(Long orderId, String pdfPath) {
        Orders order = orderRepo.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));
        order.setInvoicePath(pdfPath);
        Orders savedOrder = orderRepo.save(order);
        return orderService.toOrdersResponse(savedOrder);
    }

    public OrdersResponse updateInvoice(OrdersResponse ordersResponse) {
        String pdfPath = generateInvoicePDF(ordersResponse);
        return savePDFPath(ordersResponse.orderId(), pdfPath);
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

    @Autowired
    public void setInvoicePathService(InvoicePathService invoicePathService) {
        this.invoicePathService = invoicePathService;
    }

    @Autowired
    public void setInvoiceGenerator(InvoiceGenerator invoiceGenerator) {
        this.invoiceGenerator = invoiceGenerator;
    }

    @Autowired
    public void setOrderRepo(OrderRepo orderRepo) {
        this.orderRepo = orderRepo;
    }

    @Autowired
    public void setOrderService(OrderService orderService) {
        this.orderService = orderService;
    }
}
