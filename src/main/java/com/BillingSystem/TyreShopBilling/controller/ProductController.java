package com.BillingSystem.TyreShopBilling.controller;

import com.BillingSystem.TyreShopBilling.model.dto.ProductRequest;
import com.BillingSystem.TyreShopBilling.model.dto.ProductResponse;
import com.BillingSystem.TyreShopBilling.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class ProductController {

    private ProductService productService;

    @GetMapping("/products")
    public ResponseEntity<List<ProductResponse>> getAllProducts() {
        return ResponseEntity.ok(productService.getAllProducts());
    }

    @GetMapping("/product/{productId}")
    public ResponseEntity<ProductResponse> getProductById(@PathVariable int productId) {
        // ResourceNotFoundException thrown by service → handled by GlobalExceptionHandler
        return ResponseEntity.ok(productService.getProductById(productId));
    }

    @PostMapping("/products")
    public ResponseEntity<ProductResponse> addProduct(@RequestBody ProductRequest productReq) {
        // ResourceAlreadyExistsException thrown by service → handled by GlobalExceptionHandler
        return ResponseEntity.status(HttpStatus.CREATED).body(productService.addProduct(productReq));
    }

    @PutMapping("/product/{productId}")
    public ResponseEntity<ProductResponse> updateProduct(
            @PathVariable int productId,
            @RequestBody ProductRequest updatedProduct) {
        // ResourceNotFoundException thrown by service → handled by GlobalExceptionHandler
        return ResponseEntity.ok(productService.updateProduct(productId, updatedProduct));
    }

    @DeleteMapping("/product/{productId}")
    public ResponseEntity<Void> deleteProductById(@PathVariable int productId) {
        // ResourceNotFoundException thrown by service → handled by GlobalExceptionHandler
        productService.deleteProductById(productId);
        return ResponseEntity.noContent().build();
    }

    @Autowired
    public void setProductService(ProductService productService) {
        this.productService = productService;
    }

}
