package com.cloudfly.pos.services;

import com.cloudfly.pos.models.dto.AuthResponse;
import com.cloudfly.pos.models.dto.LoginRequest;
import com.cloudfly.pos.services.api.ApiClient;
import com.cloudfly.pos.utils.SessionManager;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

import java.util.function.Consumer;

public class AuthService {

    public interface LoginCallback {
        void onSuccess(AuthResponse response);

        void onError(String message);
    }

    public void login(String username, String password, LoginCallback callback) {
        LoginRequest request = new LoginRequest(username, password);

        Call<AuthResponse> call = ApiClient.getApiService().login(request);
        call.enqueue(new Callback<AuthResponse>() {
            @Override
            public void onResponse(Call<AuthResponse> call, Response<AuthResponse> response) {
                if (response.isSuccessful() && response.body() != null) {
                    AuthResponse authResponse = response.body();

                    if (authResponse.isStatus()) {
                        // Guardar sesión
                        SessionManager.getInstance().login(authResponse.getUser(), authResponse.getJwt());
                        callback.onSuccess(authResponse);
                    } else {
                        callback.onError(authResponse.getMessage());
                    }
                } else {
                    callback.onError("Error de autenticación: " + response.code());
                }
            }

            @Override
            public void onFailure(Call<AuthResponse> call, Throwable t) {
                callback.onError("Error de conexión: " + t.getMessage());
            }
        });
    }

    public void logout() {
        SessionManager.getInstance().logout();
    }

    public boolean isLoggedIn() {
        return SessionManager.getInstance().isLoggedIn();
    }
}
