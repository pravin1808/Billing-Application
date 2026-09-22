package com.BillingSystem.TyreShopBilling.repository;

import com.BillingSystem.TyreShopBilling.model.Orders;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface OrderRepo extends JpaRepository<Orders, Long> {

    @Query("""
        SELECT o FROM Orders o
        WHERE LOWER(o.customerName) LIKE LOWER(CONCAT('%', :search, '%'))
            OR CAST(o.customerMobileNumber AS string) LIKE CONCAT('%', :search, '%')
            OR CAST(o.invoiceNumber AS string) LIKE CONCAT('%', :search, '%')
            OR LOWER(o.paymentMethod) LIKE LOWER(CONCAT('%', :search, '%'))
        """)
    Page<Orders> searchOrders(
            @Param("search") String search,
            Pageable pageable
    );

    @Query(value = """
    SELECT 
        TO_CHAR(months.month, 'YYYY-MM') AS month,
        COALESCE(SUM(o.total_amount), 0) AS amount
    FROM generate_series(
        make_date(:year, :month, 1) - INTERVAL '11 months',
        make_date(:year, :month, 1),
        INTERVAL '1 month'
    ) AS months(month)
    LEFT JOIN orders o
        ON DATE_TRUNC('month', o.order_date) = months.month
    GROUP BY months.month
    ORDER BY months.month
    """, nativeQuery = true)
    List<Object[]> getLast12MonthsSales(
            @Param("year") int year,
            @Param("month") int month
    );


    @Query(value = """
    SELECT
        TO_CHAR(days.day, 'YYYY-MM-DD') AS date,
        COALESCE(SUM(o.total_amount), 0) AS amount
    FROM generate_series(
        CAST(:date AS date) - INTERVAL '6 days',
        CAST(:date AS date),
        INTERVAL '1 day'
    ) AS days(day)
    LEFT JOIN orders o
        ON DATE(o.order_date) = days.day
    GROUP BY days.day
    ORDER BY days.day
    """, nativeQuery = true)
    List<Object[]> getLast7DaysSales(@Param("date") LocalDate date);
}
