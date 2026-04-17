package com.BillingSystem.TyreShopBilling.repository;

import com.BillingSystem.TyreShopBilling.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProductRepo extends JpaRepository<Product, Integer> {

    Optional<Product> findByDescriptionAndSize(String description, String size);
}
