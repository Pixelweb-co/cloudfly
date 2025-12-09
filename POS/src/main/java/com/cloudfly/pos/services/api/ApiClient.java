package com.cloudfly.pos.services.api;

import com.cloudfly.pos.config.AppConfig;
import com.cloudfly.pos.utils.SessionManager;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.logging.HttpLoggingInterceptor;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;

import java.util.concurrent.TimeUnit;

public class ApiClient {

    private static Retrofit retrofit = null;
    private static ApiService apiService = null;

    public static ApiService getApiService() {
        if (apiService == null) {
            apiService = getClient().create(ApiService.class);
        }
        return apiService;
    }

    private static Retrofit getClient() {
        if (retrofit == null) {
            // Logging interceptor para debug
            HttpLoggingInterceptor logging = new HttpLoggingInterceptor();
            logging.setLevel(HttpLoggingInterceptor.Level.BODY);

            // Cliente HTTP con timeout y logging
            OkHttpClient client = new OkHttpClient.Builder()
                    .connectTimeout(AppConfig.CONNECTION_TIMEOUT, TimeUnit.SECONDS)
                    .readTimeout(AppConfig.READ_TIMEOUT, TimeUnit.SECONDS)
                    .writeTimeout(AppConfig.WRITE_TIMEOUT, TimeUnit.SECONDS)
                    .addInterceptor(logging)
                    .addInterceptor(chain -> {
                        // Interceptor para agregar token automáticamente
                        Request original = chain.request();
                        Request.Builder requestBuilder = original.newBuilder();

                        String token = SessionManager.getInstance().getToken();
                        if (token != null && !original.url().encodedPath().contains("/auth/")) {
                            requestBuilder.header("Authorization", "Bearer " + token);
                        }

                        Request request = requestBuilder.build();
                        return chain.proceed(request);
                    })
                    .build();

            retrofit = new Retrofit.Builder()
                    .baseUrl(AppConfig.getApiUrl())
                    .client(client)
                    .addConverterFactory(GsonConverterFactory.create())
                    .build();
        }

        return retrofit;
    }

    public static void reset() {
        retrofit = null;
        apiService = null;
    }
}
