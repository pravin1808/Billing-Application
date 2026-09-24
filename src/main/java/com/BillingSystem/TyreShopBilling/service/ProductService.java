package com.BillingSystem.TyreShopBilling.service;

import com.BillingSystem.TyreShopBilling.exception.InsufficientStockException;
import com.BillingSystem.TyreShopBilling.exception.InvalidRequestException;
import com.BillingSystem.TyreShopBilling.exception.ResourceAlreadyExistsException;
import com.BillingSystem.TyreShopBilling.exception.ResourceNotFoundException;
import com.BillingSystem.TyreShopBilling.model.Product;
import com.BillingSystem.TyreShopBilling.model.dto.PageResponse;
import com.BillingSystem.TyreShopBilling.model.dto.ProductRequest;
import com.BillingSystem.TyreShopBilling.model.dto.ProductResponse;
import com.BillingSystem.TyreShopBilling.repository.OrderedProductRepo;
import com.BillingSystem.TyreShopBilling.repository.ProductRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class ProductService {

    private ProductRepo productRepo;
    private OrderedProductRepo orderedProductRepo;

    public List<ProductResponse> getAllProducts(){
        List<Product> productList = productRepo.findAll();
        List<ProductResponse> productResponseList = new ArrayList<>();

        for(Product product : productList){
            ProductResponse productResponse = new ProductResponse(
                    product.getProduct_id(),
                    product.getDescription(),
                    product.getSize(),
                    product.getGst(),
                    product.getHsnNumber(),
                    product.getQuantity()
            );
            productResponseList.add(productResponse);
        }
        return productResponseList;
    }

    public PageResponse<ProductResponse> getProductsPaged(int page, int size, String sortBy, String sortDir, String search) {
        String safeSortBy;
        if (sortBy == null || sortBy.isBlank() || "product_id".equalsIgnoreCase(sortBy) || "id".equalsIgnoreCase(sortBy)) {
            safeSortBy = "productId";
        } else {
            safeSortBy = sortBy;
        }
        Sort sort = "desc".equalsIgnoreCase(sortDir)
                ? Sort.by(safeSortBy).descending()
                : Sort.by(safeSortBy).ascending();
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size), sort);

        Page<Product> productPage;

        if(search == null || search.isBlank()){
            productPage = productRepo.findAll(pageable);
        }else{
            productPage = productRepo.searchProducts(search.trim(), pageable);
        }

        Page<ProductResponse> responsePage = productPage.map(product -> new ProductResponse(
                product.getProduct_id(),
                product.getDescription(),
                product.getSize(),
                product.getGst(),
                product.getHsnNumber(),
                product.getQuantity()
        ));

        return PageResponse.from(responsePage);
    }

    public ProductResponse getProductById(int productId) {
        Product product = productRepo.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));

        return new ProductResponse(
                product.getProduct_id(),
                product.getDescription(),
                product.getSize(),
                product.getGst(),
                product.getHsnNumber(),
                product.getQuantity()
        );
    }

    public ProductResponse addProduct(ProductRequest productReq) {
        if (productRepo.findByDescriptionAndSize(productReq.description(), productReq.size()).isPresent()) {
            throw new ResourceAlreadyExistsException(
                    "Product",
                    "description and size",
                    productReq.description() + " / " + productReq.size()
            );
        }

        Product product = new Product();
        product.setDescription(productReq.description());
        product.setSize(productReq.size());
        product.setGst(productReq.gst());
        product.setHsnNumber(productReq.hsnNumber());
        product.setQuantity(productReq.quantity());
        Product addedProduct = productRepo.save(product);

        return new ProductResponse(
                addedProduct.getProduct_id(),
                addedProduct.getDescription(),
                addedProduct.getSize(),
                addedProduct.getGst(),
                addedProduct.getHsnNumber(),
                addedProduct.getQuantity()
        );
    }

    public ProductResponse updateProduct(int productId, ProductRequest updatedProduct){
        Product existingProduct = productRepo.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));

        existingProduct.setDescription(updatedProduct.description());
        existingProduct.setSize(updatedProduct.size());
        existingProduct.setGst(updatedProduct.gst());
        existingProduct.setQuantity(updatedProduct.quantity());
        existingProduct.setHsnNumber(updatedProduct.hsnNumber());

        Product newProduct = productRepo.save(existingProduct);

        return new ProductResponse(
                newProduct.getProduct_id(),
                newProduct.getDescription(),
                newProduct.getSize(),
                newProduct.getGst(),
                newProduct.getHsnNumber(),
                newProduct.getQuantity()
        );
    }

    public void validateStock(Product product, int quantitySell) {
        if (product == null) {
            return;
        }
        if (product.getQuantity() < quantitySell) {
            throw new InsufficientStockException(product.getDescription(), quantitySell, product.getQuantity());
        }
    }

    public void updateStock(Product product, int quantitySell) {
        if (product == null) {
            return;
        }
        product.setQuantity(product.getQuantity() - quantitySell);
        productRepo.save(product);
    }

    public void restoreStock(Product product, int quantityToRestore) {
        if (product == null) {
            return;
        }
        Product currentProduct = productRepo.findById(product.getProduct_id()).orElse(product);
        currentProduct.setQuantity(currentProduct.getQuantity() + quantityToRestore);
        productRepo.save(currentProduct);
    }

    public void deleteProductById(int productId) {
        Product product = productRepo.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));

        // Condition 1: Fast in-memory check if physical stock remains
        if (product.getQuantity() != null && product.getQuantity() > 0) {
            throw new InvalidRequestException(
                    "Cannot delete product '" + product.getDescription() + " (" + product.getSize() + ")' " +
                    "because it still has " + product.getQuantity() + " units in stock. Reduce stock to 0 first."
            );
        }

        // Condition 2: Check if this product was ever sold in any order
        if (orderedProductRepo != null && orderedProductRepo.existsByProduct_ProductId(productId)) {
            throw new InvalidRequestException(
                    "Cannot delete product '" + product.getDescription() + " (" + product.getSize() + ")' " +
                    "because it is recorded in existing invoices. Products with sales history cannot be deleted."
            );
        }

        productRepo.deleteById(productId);
    }

    @Autowired
    public void setProductRepo(ProductRepo productRepo){
        this.productRepo = productRepo;
    }

    @Autowired
    public void setOrderedProductRepo(OrderedProductRepo orderedProductRepo) {
        this.orderedProductRepo = orderedProductRepo;
    }

}
