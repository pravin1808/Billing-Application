package com.BillingSystem.TyreShopBilling.service;

import com.BillingSystem.TyreShopBilling.exception.ResourceAlreadyExistsException;
import com.BillingSystem.TyreShopBilling.exception.ResourceNotFoundException;
import com.BillingSystem.TyreShopBilling.model.GstNumber;
import com.BillingSystem.TyreShopBilling.repository.GstNumberRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class GstNumberService {

    private GstNumberRepo gstNumberRepo;

    public List<GstNumber> getAllGST(){
        return gstNumberRepo.findAll();
    }

    public GstNumber addGstNumber(int gst){
        if(gstNumberRepo.existsByGst(gst)){
            throw new ResourceAlreadyExistsException("GST rate " + gst + "% already exists");
        }

        GstNumber gstNumber = new GstNumber();
        gstNumber.setGst(gst);

        return gstNumberRepo.save(gstNumber);
    }

    public void deleteGstNumberById(int gstId){
        GstNumber gstNumber = gstNumberRepo.findById(gstId)
                .orElseThrow(() -> new ResourceNotFoundException("GST", "id", gstId));

        gstNumberRepo.delete(gstNumber);
    }
    
    @Autowired
    public void setGstNumberRepo(GstNumberRepo gstNumberRepo){
        this.gstNumberRepo = gstNumberRepo;
    }

}
