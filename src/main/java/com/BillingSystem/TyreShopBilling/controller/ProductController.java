package com.BillingSystem.TyreShopBilling.controller;

import com.BillingSystem.TyreShopBilling.model.dto.PageResponse;
import com.BillingSystem.TyreShopBilling.model.dto.ProductRequest;
import com.BillingSystem.TyreShopBilling.model.dto.ProductResponse;
import com.BillingSystem.TyreShopBilling.service.ProductService;
import jakarta.validation.Valid;
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
    public ResponseEntity<?> getProducts(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(defaultValue = "productId") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {
        if (page != null || size != null) {
            int p = (page != null) ? page : 0;
            int s = (size != null) ? size : 10;
            return ResponseEntity.ok(productService.getProductsPaged(p, s, sortBy, sortDir));
        }
        return ResponseEntity.ok(productService.getAllProducts());
    }

    @GetMapping("/products/paged")
    public ResponseEntity<PageResponse<ProductResponse>> getProductsPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "productId") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {
        return ResponseEntity.ok(productService.getProductsPaged(page, size, sortBy, sortDir));
    }

    @GetMapping("/product/{productId}")
    public ResponseEntity<ProductResponse> getProductById(@PathVariable int productId) {
        return ResponseEntity.ok(productService.getProductById(productId));
    }

    @PostMapping("/products")
    public ResponseEntity<ProductResponse> addProduct(@Valid @RequestBody ProductRequest productReq) {
        return ResponseEntity.status(HttpStatus.CREATED).body(productService.addProduct(productReq));
    }

    @PutMapping("/product/{productId}")
    public ResponseEntity<ProductResponse> updateProduct(
            @PathVariable int productId,
            @Valid @RequestBody ProductRequest updatedProduct) {
        return ResponseEntity.ok(productService.updateProduct(productId, updatedProduct));
    }

    @DeleteMapping("/product/{productId}")
    public ResponseEntity<Void> deleteProductById(@PathVariable int productId) {
        productService.deleteProductById(productId);
        return ResponseEntity.noContent().build();
    }

    @Autowired
    public void setProductService(ProductService productService) {
        this.productService = productService;
    }

}
