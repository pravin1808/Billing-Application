package com.BillingSystem.TyreShopBilling.controller;

import com.BillingSystem.TyreShopBilling.model.GstNumber;
import com.BillingSystem.TyreShopBilling.service.GstNumberService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Validated
@RestController
@RequestMapping("/api")
public class GstNumberController {

    private GstNumberService gstNumberService;

    @GetMapping("/gst")
    public ResponseEntity<List<GstNumber>> getAllGST(){
        return ResponseEntity.ok(gstNumberService.getAllGST());
    }

    @PostMapping("/gst/{gst}")
    public ResponseEntity<GstNumber> addGstNumber(@NotNull @Min(0) @Max(100) @PathVariable Integer gst){
        return ResponseEntity.status(HttpStatus.CREATED).body(gstNumberService.addGstNumber(gst));
    }

    @DeleteMapping("/gst/{gstId}")
    public ResponseEntity<?> deleteGstNumber(@NotNull @PathVariable Integer gstId){
        gstNumberService.deleteGstNumberById(gstId);
        return ResponseEntity.noContent().build();
    }

    @Autowired
    public void setGstNumberService(GstNumberService gstNumberService){
        this.gstNumberService = gstNumberService;
    }

}
