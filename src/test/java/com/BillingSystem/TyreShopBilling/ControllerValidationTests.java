package com.BillingSystem.TyreShopBilling;

import com.BillingSystem.TyreShopBilling.controller.InvoicePathController;
import com.BillingSystem.TyreShopBilling.controller.ProductController;
import com.BillingSystem.TyreShopBilling.exception.GlobalExceptionHandler;
import com.BillingSystem.TyreShopBilling.service.InvoicePathService;
import com.BillingSystem.TyreShopBilling.service.ProductService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

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
}
