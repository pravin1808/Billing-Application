package com.BillingSystem.TyreShopBilling.service;

import com.BillingSystem.TyreShopBilling.model.Product;
import com.BillingSystem.TyreShopBilling.model.dto.ProductRequest;
import com.BillingSystem.TyreShopBilling.model.dto.ProductResponse;
import com.BillingSystem.TyreShopBilling.repository.ProductRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class ProductService {

    private ProductRepo productRepo;

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

    public ResponseEntity<?> getProductById(int productId) {
        Product product = productRepo.findById(productId).orElse(new Product(-1));
        if(product.getProduct_id()>0) {
            ProductResponse productResponse = new ProductResponse(
                    product.getProduct_id(),
                    product.getDescription(),
                    product.getSize(),
                    product.getGst(),
                    product.getHsnNumber(),
                    product.getQuantity()
            );
            return new ResponseEntity<>(productResponse, HttpStatus.FOUND);
        }else{
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    public ProductResponse addProduct(ProductRequest productReq) {
        Product product = new Product();
        product.setDescription(productReq.description());
        product.setSize(productReq.size());
        product.setGst(productReq.gst());
        product.setHsnNumber(productReq.hsnNumber());
        product.setQuantity(productReq.quantity());
        Product addedProduct = productRepo.save(product);

        ProductResponse productResponse = new ProductResponse(
                product.getProduct_id(),
                addedProduct.getDescription(),
                addedProduct.getSize(),
                addedProduct.getGst(),
                addedProduct.getHsnNumber(),
                addedProduct.getQuantity()
        );
        return productResponse;
    }

    public ProductResponse updateProduct(int productId, ProductRequest updatedProduct){
        Product existingProduct = productRepo.findById(productId).orElse(new Product(-1));

        existingProduct.setDescription(updatedProduct.description());
        existingProduct.setSize(updatedProduct.size());
        existingProduct.setGst(updatedProduct.gst());
        existingProduct.setQuantity(updatedProduct.quantity());
        existingProduct.setHsnNumber(updatedProduct.hsnNumber());

        Product newProduct = productRepo.save(existingProduct);

        ProductResponse productResponse = new ProductResponse(
                newProduct.getProduct_id(),
                newProduct.getDescription(),
                newProduct.getSize(),
                newProduct.getGst(),
                newProduct.getHsnNumber(),
                newProduct.getQuantity()
        );
        return productResponse;

    }

    public boolean deleteProductById(int productId){
        Product toDeleteProduct = productRepo.findById(productId).orElse(new Product(-1));
        if(toDeleteProduct.getProduct_id()>0){
            productRepo.deleteById(productId);
            return true;
        }else{
            return false;
        }
    }

    @Autowired
    public void setProductRepo(ProductRepo productRepo){
        this.productRepo = productRepo;
    }

}
