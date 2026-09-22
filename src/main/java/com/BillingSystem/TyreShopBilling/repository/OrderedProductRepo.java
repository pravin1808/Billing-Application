package com.BillingSystem.TyreShopBilling.repository;

import com.BillingSystem.TyreShopBilling.model.OrderedProducts;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OrderedProductRepo extends JpaRepository<OrderedProducts, Long> {

    boolean existsByProduct_ProductId(Integer productId);

}
