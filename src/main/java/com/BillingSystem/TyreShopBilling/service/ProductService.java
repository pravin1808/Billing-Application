package com.BillingSystem.TyreShopBilling.service;

import com.BillingSystem.TyreShopBilling.model.Product;
import com.BillingSystem.TyreShopBilling.model.dto.ProductRequest;
import com.BillingSystem.TyreShopBilling.model.dto.ProductResponse;
import com.BillingSystem.TyreShopBilling.repository.ProductRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

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

    public ProductResponse getProductById(int productId) {
        Optional<Product> product = productRepo.findById(productId);
        if (product.isEmpty()) {
            throw new RuntimeException("Product Not Found");
        }
        Product p = product.get();
        return new ProductResponse(
                p.getProduct_id(),
                p.getDescription(),
                p.getSize(),
                p.getGst(),
                p.getHsnNumber(),
                p.getQuantity()
        );
    }

    public ProductResponse addProduct(ProductRequest productReq) {

        Optional<Product> exProduct = productRepo.findByDescriptionAndSize(productReq.description(), productReq.size());

        if (exProduct.isPresent()) {
            throw new RuntimeException("Product Already Exists");
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
        Product existingProduct = productRepo.findById(productId).orElseThrow(() -> new RuntimeException("Product Not Found"));

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

    public void validateStock(String description, String size, int quantitySell) throws Exception {

        Optional<Product> optionalProduct = productRepo.findByDescriptionAndSize(description, size);
        if (optionalProduct.isEmpty()) {
            return;
        }
        Product product = optionalProduct.get();
        if(product.getQuantity()<quantitySell){
            throw new RuntimeException("Insufficient stock for : "+product.getDescription());
        }
    }

    public void updateStock(String description, String size, int quantitySell){
        Optional<Product> optionalProduct = productRepo.findByDescriptionAndSize(description, size);
        if (optionalProduct.isEmpty()) {
            return;
        }
        Product product = optionalProduct.get();
        product.setQuantity(product.getQuantity() - quantitySell);
        productRepo.save(product);
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
