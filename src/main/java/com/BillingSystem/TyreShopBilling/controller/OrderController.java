package com.BillingSystem.TyreShopBilling.controller;

import com.BillingSystem.TyreShopBilling.model.dto.OrdersRequest;
import com.BillingSystem.TyreShopBilling.model.dto.OrdersResponse;
import com.BillingSystem.TyreShopBilling.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api")
public class OrderController {

    private OrderService orderService;

    @GetMapping("/orders")
    public ResponseEntity<List<OrdersResponse>> getAllOrders(){
        return new ResponseEntity<>(orderService.getAllOrders(), HttpStatus.FOUND);
    }

    @GetMapping("/order/{orderId}")
    public ResponseEntity<?> getOrderById(@PathVariable int orderId){
        return new ResponseEntity<>(orderService.getOrderById(orderId), HttpStatus.FOUND);
    }

    @PostMapping("/order")
    public ResponseEntity<OrdersResponse> addOrder(@RequestBody OrdersRequest newOrderRequest){
        OrdersResponse addedOrder = null;
        try{
            addedOrder = orderService.addNewOrder(newOrderRequest);
            return new ResponseEntity<>(addedOrder, HttpStatus.CREATED);
        }catch (Exception e){
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }

    @PutMapping("/order/{orderId}")
    public ResponseEntity<?> updateOrder(@PathVariable long orderId, @RequestBody OrdersRequest updatedOrder) throws IOException {
        return new ResponseEntity<>(orderService.updateOrder(orderId, updatedOrder), HttpStatus.OK);
    }

    @DeleteMapping("/order/{orderId}")
    public ResponseEntity<?> deleteOrderById(@PathVariable long orderId){
        boolean isDeleted = orderService.deleteOrderById(orderId);
        if(isDeleted){
            return new ResponseEntity<>(HttpStatus.ACCEPTED);
        }else{
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @Autowired
    public void setOrderService(OrderService orderService){
        this.orderService = orderService;
    }
}
