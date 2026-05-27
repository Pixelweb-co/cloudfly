package com.cloudfly.pos.services.api;

import com.cloudfly.pos.models.dto.AuthResponse;
import com.cloudfly.pos.models.dto.LoginRequest;
import com.cloudfly.pos.models.Product;
import retrofit2.Call;
import retrofit2.http.*;

import java.util.List;

public interface ApiService {

        // Autenticación
        @POST("auth/login")
        Call<AuthResponse> login(@Body LoginRequest request);

        // Productos
        @GET("products")
        Call<List<Product>> getProducts(@Header("Authorization") String token);

        @GET("products/{id}")
        Call<Product> getProductById(
                        @Header("Authorization") String token,
                        @Path("id") Long id);

        @GET("products/search")
        Call<List<Product>> searchProducts(
                        @Header("Authorization") String token,
                        @Query("query") String query);

        @GET("products/barcode/{barcode}")
        Call<Product> getProductByBarcode(
                        @Header("Authorization") String token,
                        @Path("barcode") String barcode);

        // Órdenes (para futura implementación)
        @POST("orders")
        Call<Object> createOrder(
                        @Header("Authorization") String token,
                        @Body Object orderRequest);
}
