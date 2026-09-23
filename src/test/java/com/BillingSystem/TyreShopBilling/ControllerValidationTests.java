package com.BillingSystem.TyreShopBilling;

import com.BillingSystem.TyreShopBilling.controller.InvoicePathController;
import com.BillingSystem.TyreShopBilling.controller.OrderController;
import com.BillingSystem.TyreShopBilling.controller.ProductController;
import com.BillingSystem.TyreShopBilling.exception.GlobalExceptionHandler;
import com.BillingSystem.TyreShopBilling.service.InvoicePathService;
import com.BillingSystem.TyreShopBilling.service.InvoiceService;
import com.BillingSystem.TyreShopBilling.service.OrderService;
import com.BillingSystem.TyreShopBilling.service.ProductService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class ControllerValidationTests {

    private MockMvc mockMvcProduct;
    private MockMvc mockMvcPath;

    @Mock
    private ProductService productService;

    @Mock
    private InvoicePathService invoicePathService;

    @Mock
    private OrderService orderService;

    @Mock
    private InvoiceService invoiceService;

    private MockMvc mockMvcOrder;

    @BeforeEach
    void setUp() {
        ProductController productController = new ProductController();
        productController.setProductService(productService);
        mockMvcProduct = MockMvcBuilders.standaloneSetup(productController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        InvoicePathController invoicePathController = new InvoicePathController();
        invoicePathController.setInvoicePathService(invoicePathService);
        mockMvcPath = MockMvcBuilders.standaloneSetup(invoicePathController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        OrderController orderController = new OrderController();
        orderController.setOrderService(orderService);
        orderController.setInvoiceService(invoiceService);
        mockMvcOrder = MockMvcBuilders.standaloneSetup(orderController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void whenPostInvalidProduct_thenReturns400WithErrors() throws Exception {
        String invalidJson = """
                {
                    "description": "",
                    "size": "",
                    "hsnNumber": -1,
                    "gst": -5,
                    "quantity": -2
                }
                """;

        mockMvcProduct.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    @Test
    void whenPutBlankInvoicePath_thenReturns400() throws Exception {
        String invalidJson = """
                {
                    "invoicePath": ""
                }
                """;

        mockMvcPath.perform(put("/api/order/invoicePath")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Invoice folder path is required")));
    }

    @Test
    void whenGetInvoicePath_thenReturnsCurrentPath() throws Exception {
        org.mockito.Mockito.when(invoicePathService.getInvoicePath()).thenReturn("C:/SavedInvoices");

        mockMvcPath.perform(get("/api/order/invoicePath"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.invoicePath").value("C:/SavedInvoices"));
    }

    @Test
    void whenCancelOrder_thenRegeneratesInvoiceAndReturnsUpdatedResponse() throws Exception {
        long orderId = 101L;
        com.BillingSystem.TyreShopBilling.model.dto.OrdersResponse cancelledOrder = new com.BillingSystem.TyreShopBilling.model.dto.OrdersResponse(
                orderId, "Ramesh", 9876543210L, "GST123", 101,
                "C:/Invoices/Ramesh 101 invoice.pdf",
                java.time.LocalDateTime.now(), 5000f, "CASH",
                true, java.time.LocalDateTime.now(), java.util.List.of()
        );
        com.BillingSystem.TyreShopBilling.model.dto.OrdersResponse updatedWithCancelledInvoice = new com.BillingSystem.TyreShopBilling.model.dto.OrdersResponse(
                orderId, "Ramesh", 9876543210L, "GST123", 101,
                "C:/Invoices/cancelled/Ramesh 101 invoice.pdf",
                cancelledOrder.orderDate(), 5000f, "CASH",
                true, cancelledOrder.cancelledAt(), java.util.List.of()
        );

        org.mockito.Mockito.when(orderService.cancelOrder(orderId)).thenReturn(cancelledOrder);
        org.mockito.Mockito.when(invoiceService.updateInvoice(cancelledOrder)).thenReturn(updatedWithCancelledInvoice);

        mockMvcOrder.perform(put("/api/order/" + orderId + "/cancel"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orderId").value(101))
                .andExpect(jsonPath("$.isCancelled").value(true))
                .andExpect(jsonPath("$.invoicePath").value("C:/Invoices/cancelled/Ramesh 101 invoice.pdf"));

        org.mockito.Mockito.verify(orderService).cancelOrder(orderId);
        org.mockito.Mockito.verify(invoiceService).updateInvoice(cancelledOrder);
    }

    @Test
    void whenPrintCancelledOrder_thenPrintingIsNotRestricted() throws Exception {
        long orderId = 101L;

        mockMvcOrder.perform(post("/api/order/" + orderId + "/invoice/print"))
                .andExpect(status().isOk())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.content().string(
                        org.hamcrest.Matchers.containsString("sent to printer successfully")
                ));

        org.mockito.Mockito.verify(invoiceService).printOrderInvoice(orderId);
    }
}
