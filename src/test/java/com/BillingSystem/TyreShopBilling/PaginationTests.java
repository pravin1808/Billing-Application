package com.BillingSystem.TyreShopBilling;

import com.BillingSystem.TyreShopBilling.model.Orders;
import com.BillingSystem.TyreShopBilling.model.Product;
import com.BillingSystem.TyreShopBilling.model.dto.OrdersResponse;
import com.BillingSystem.TyreShopBilling.model.dto.PageResponse;
import com.BillingSystem.TyreShopBilling.model.dto.ProductResponse;
import com.BillingSystem.TyreShopBilling.repository.OrderRepo;
import com.BillingSystem.TyreShopBilling.repository.ProductRepo;
import com.BillingSystem.TyreShopBilling.service.OrderService;
import com.BillingSystem.TyreShopBilling.service.ProductService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PaginationTests {

    @Mock
    private ProductRepo productRepo;

    @Mock
    private OrderRepo orderRepo;

    @InjectMocks
    private ProductService productService;

    @InjectMocks
    private OrderService orderService;

    @Test
    void whenGetProductsPaged_thenReturnsCorrectPageResponse() {
        List<Product> products = List.of(
                new Product("MRF ZLX", "165/80 R14", 4011, 28, 20, 1),
                new Product("CEAT Milaze", "155/80 R13", 4011, 28, 15, 2)
        );
        Page<Product> page = new PageImpl<>(products, Pageable.ofSize(2), 10);
        when(productRepo.findAll(any(Pageable.class))).thenReturn(page);

        PageResponse<ProductResponse> response = productService.getProductsPaged(0, 2, "productId", "asc", null);

        assertNotNull(response);
        assertEquals(2, response.content().size());
        assertEquals(0, response.pageNumber());
        assertEquals(2, response.pageSize());
        assertEquals(10, response.totalElements());
        assertEquals(5, response.totalPages());
        assertFalse(response.isLast());
        assertEquals("MRF ZLX", response.content().get(0).description());
    }

    @Test
    void whenGetProductsPaged_withSearch_thenCallsSearchProducts() {
        List<Product> products = List.of(
                new Product("MRF ZLX", "165/80 R14", 4011, 28, 20, 1)
        );
        Page<Product> page = new PageImpl<>(products, Pageable.ofSize(1), 1);
        when(productRepo.searchProducts(org.mockito.ArgumentMatchers.eq("MRF"), any(Pageable.class))).thenReturn(page);

        PageResponse<ProductResponse> response = productService.getProductsPaged(0, 1, "productId", "asc", "MRF");

        assertNotNull(response);
        assertEquals(1, response.content().size());
        assertEquals("MRF ZLX", response.content().get(0).description());
    }

    @Test
    void whenGetOrdersPaged_thenReturnsCorrectPageResponse() {
        Orders o1 = new Orders();
        o1.setOrderId(101);
        o1.setCustomerName("Sunil Verma");
        o1.setCustomerMobileNumber(9876543210L);
        o1.setOrderDate(LocalDateTime.now());
        o1.setTotalAmount(5000.0f);
        o1.setPaymentMethod("CASH");
        o1.setCancelled(false);
        o1.setOrderedProducts(new ArrayList<>());

        Page<Orders> page = new PageImpl<>(List.of(o1), Pageable.ofSize(1), 1);
        when(orderRepo.findByIsCancelled(org.mockito.ArgumentMatchers.eq(false), any(Pageable.class))).thenReturn(page);

        PageResponse<OrdersResponse> response = orderService.getOrdersPaged(0, 1, "orderId", "desc", null);

        assertNotNull(response);
        assertEquals(1, response.content().size());
        assertEquals(0, response.pageNumber());
        assertEquals(1, response.pageSize());
        assertEquals(1, response.totalElements());
        assertEquals(1, response.totalPages());
        assertTrue(response.isLast());
        assertEquals("Sunil Verma", response.content().get(0).customerName());
        assertFalse(response.content().get(0).isCancelled());
    }

    @Test
    void whenGetOrdersPaged_withSearch_thenCallsSearchOrdersByCancelledStatus() {
        Orders o1 = new Orders();
        o1.setOrderId(102);
        o1.setCustomerName("Akash Patel");
        o1.setCustomerMobileNumber(9123456780L);
        o1.setOrderDate(LocalDateTime.now());
        o1.setTotalAmount(3500.0f);
        o1.setPaymentMethod("UPI");
        o1.setCancelled(false);
        o1.setOrderedProducts(new ArrayList<>());

        Page<Orders> page = new PageImpl<>(List.of(o1), Pageable.ofSize(1), 1);
        when(orderRepo.searchOrdersByCancelledStatus(org.mockito.ArgumentMatchers.eq("Akash"), org.mockito.ArgumentMatchers.eq(false), any(Pageable.class))).thenReturn(page);

        PageResponse<OrdersResponse> response = orderService.getOrdersPaged(0, 1, "orderId", "desc", "Akash");

        assertNotNull(response);
        assertEquals(1, response.content().size());
        assertEquals("Akash Patel", response.content().get(0).customerName());
    }

    @Test
    void whenGetCancelledOrdersPaged_thenCallsWithCancelledTrue() {
        Orders o1 = new Orders();
        o1.setOrderId(103);
        o1.setCustomerName("Vikram Singh");
        o1.setCustomerMobileNumber(9123456789L);
        o1.setOrderDate(LocalDateTime.now());
        o1.setTotalAmount(4200.0f);
        o1.setPaymentMethod("CARD");
        o1.setCancelled(true);
        o1.setCancelledAt(LocalDateTime.now());
        o1.setOrderedProducts(new ArrayList<>());

        Page<Orders> page = new PageImpl<>(List.of(o1), Pageable.ofSize(1), 1);
        when(orderRepo.findByIsCancelled(org.mockito.ArgumentMatchers.eq(true), any(Pageable.class))).thenReturn(page);

        PageResponse<OrdersResponse> response = orderService.getOrdersPaged(0, 1, "orderId", "desc", null, true);

        assertNotNull(response);
        assertEquals(1, response.content().size());
        assertTrue(response.content().get(0).isCancelled());
        assertNotNull(response.content().get(0).cancelledAt());
    }
}
