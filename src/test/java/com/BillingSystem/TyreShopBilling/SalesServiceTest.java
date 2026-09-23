package com.BillingSystem.TyreShopBilling;

import com.BillingSystem.TyreShopBilling.repository.OrderRepo;
import com.BillingSystem.TyreShopBilling.service.SalesService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SalesServiceTest {

    @Mock
    private OrderRepo orderRepo;

    private SalesService salesService;

    @BeforeEach
    void setUp() {
        salesService = new SalesService();
        salesService.setOrderRepo(orderRepo);
    }

    @Test
    void testGetLast12MonthsSales() {
        int year = 2026;
        int month = 9;
        List<Object[]> repoResults = List.of(
                new Object[]{"2026-08", 45000.0},
                new Object[]{"2026-09", 9200.0}
        );
        when(orderRepo.getLast12MonthsSales(year, month)).thenReturn(repoResults);

        Map<String, Float> sales = salesService.getLast12MonthsSales(year, month);

        assertEquals(2, sales.size());
        assertEquals(45000.0f, sales.get("2026-08"));
        assertEquals(9200.0f, sales.get("2026-09"));
        verify(orderRepo).getLast12MonthsSales(year, month);
    }

    @Test
    void testGetLast7DaysSales() {
        LocalDate date = LocalDate.of(2026, 9, 23);
        List<Object[]> repoResults = List.of(
                new Object[]{"2026-09-22", 15000.0},
                new Object[]{"2026-09-23", 9200.0}
        );
        when(orderRepo.getLast7DaysSales(date)).thenReturn(repoResults);

        Map<String, Float> sales = salesService.getLast7DaysSales(date);

        assertEquals(2, sales.size());
        assertEquals(15000.0f, sales.get("2026-09-22"));
        assertEquals(9200.0f, sales.get("2026-09-23"));
        verify(orderRepo).getLast7DaysSales(date);
    }
}
