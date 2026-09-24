package com.BillingSystem.TyreShopBilling.repository;

import com.BillingSystem.TyreShopBilling.model.GstNumber;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GstNumberRepo extends JpaRepository<GstNumber, Integer> {

    boolean existsByGst(int gst);

}
