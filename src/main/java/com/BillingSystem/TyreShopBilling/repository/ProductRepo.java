package com.BillingSystem.TyreShopBilling.repository;

import com.BillingSystem.TyreShopBilling.model.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProductRepo extends JpaRepository<Product, Integer> {

    Optional<Product> findByDescriptionAndSize(String description, String size);

    boolean existsByDescriptionAndSize(String description, String size);

    @Query("""
        SELECT p FROM Product p
        WHERE LOWER(p.description) LIKE LOWER(CONCAT('%', :search, '%'))
            OR LOWER(p.size) LIKE LOWER(CONCAT('%', :search, '%'))
            OR CAST(p.hsnNumber AS string) LIKE CONCAT('%', :search, '%')
            OR CAST(p.gst AS string) LIKE CONCAT('%', :search, '%')
            OR CAST(p.quantity AS string) LIKE CONCAT('%', :search, '%')
        """)
    Page<Product> searchProducts(
            @Param("search") String search,
            Pageable pageable
    );
}
