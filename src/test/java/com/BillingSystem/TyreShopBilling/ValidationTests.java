package com.BillingSystem.TyreShopBilling;

import com.BillingSystem.TyreShopBilling.model.dto.InvoicePathRequest;
import com.BillingSystem.TyreShopBilling.model.dto.OrderedProductRequest;
import com.BillingSystem.TyreShopBilling.model.dto.OrdersRequest;
import com.BillingSystem.TyreShopBilling.model.dto.ProductRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.util.Collections;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class ValidationTests {

    private static Validator validator;

    @BeforeAll
    static void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    void whenProductRequestIsValid_thenNoViolations() {
        ProductRequest valid = new ProductRequest("Apollo Alnac 4G", "185/65 R15", 4011, 28, 50);
        Set<ConstraintViolation<ProductRequest>> violations = validator.validate(valid);
        assertTrue(violations.isEmpty(), "Valid product should have no violations");
    }

    @Test
    void whenProductRequestHasBlankFields_thenViolationsReported() {
        ProductRequest invalid = new ProductRequest("", "   ", -5, -1, -10);
        Set<ConstraintViolation<ProductRequest>> violations = validator.validate(invalid);

        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("description")));
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("size")));
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("hsnNumber")));
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("gst")));
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("quantity")));
    }

    @Test
    void whenOrdersRequestIsValid_thenNoViolations() {
        OrderedProductRequest item = new OrderedProductRequest("Apollo Alnac", "185/65 R15", 28, 4011, 4500.0f, 2);
        OrdersRequest valid = OrdersRequest.builder()
                .customerName("Rahul Sharma")
                .customerMobileNumber(9876543210L)
                .gstInNumber("27AABCU9603R1ZM")
                .paymentMethod("UPI")
                .orderedProducts(List.of(item))
                .build();

        Set<ConstraintViolation<OrdersRequest>> violations = validator.validate(valid);
        assertTrue(violations.isEmpty(), "Valid order should have no violations");
    }

    @Test
    void whenOrdersRequestHasInvalidData_thenViolationsReported() {
        OrdersRequest invalid = OrdersRequest.builder()
                .customerName("")
                .customerMobileNumber(12345L) // invalid 5-digit number
                .paymentMethod("")
                .orderedProducts(Collections.emptyList()) // empty list
                .build();

        Set<ConstraintViolation<OrdersRequest>> violations = validator.validate(invalid);
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("customerName")));
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("customerMobileNumber")));
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("paymentMethod")));
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("orderedProducts")));
    }

    @Test
    void whenOrderedProductQuantityIsZero_thenViolationReported() {
        OrderedProductRequest item = new OrderedProductRequest("CEAT Secura", "3.00-18", 28, 4011, 1500.0f, 0);
        Set<ConstraintViolation<OrderedProductRequest>> violations = validator.validate(item);

        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("quantitySell")));
    }

    @Test
    void whenInvoicePathIsBlank_thenViolationReported() {
        InvoicePathRequest invalid = new InvoicePathRequest("   ");
        Set<ConstraintViolation<InvoicePathRequest>> violations = validator.validate(invalid);

        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.getPropertyPath().toString().equals("invoicePath")));
    }

    @Test
    void whenInvoicePathIsValid_thenNoViolations() {
        InvoicePathRequest valid = new InvoicePathRequest("D:/Invoices");
        Set<ConstraintViolation<InvoicePathRequest>> violations = validator.validate(valid);

        assertTrue(violations.isEmpty());
    }
}
