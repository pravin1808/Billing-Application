package com.BillingSystem.TyreShopBilling.service;

import com.BillingSystem.TyreShopBilling.model.Product;
import com.BillingSystem.TyreShopBilling.repository.ProductRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ProductService {

    private ProductRepo productRepo;

    public List<Product> getAllProducts(){
        return productRepo.findAll();
    }

    public Product getProductById(int productId) {
        return productRepo.findById(productId).orElse(new Product(-1));
    }

    public Product addorUpdateProduct(Product product) {
        return productRepo.save(product);
    }

    public Product updateProduct(int productId, Product updatedProduct){
        Product existingProduct = productRepo.findById(productId).orElse(new Product(-1));
        existingProduct.setDescription(updatedProduct.getDescription());
        existingProduct.setSize(updatedProduct.getSize());
        existingProduct.setGst(updatedProduct.getGst());
        existingProduct.setQuantity(updatedProduct.getQuantity());
        existingProduct.setHsnNumber(updatedProduct.getHsnNumber());

        return productRepo.save(existingProduct);
    }

    @Autowired
    public void setProductRepo(ProductRepo productRepo){
        this.productRepo = productRepo;
    }

}
