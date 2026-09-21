package com.BillingSystem.TyreShopBilling.repository;

import com.BillingSystem.TyreShopBilling.model.Orders;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

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
}
