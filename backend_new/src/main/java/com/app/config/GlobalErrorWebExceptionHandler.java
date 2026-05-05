package com.app.config;

import org.springframework.boot.autoconfigure.web.WebProperties;
import org.springframework.boot.autoconfigure.web.reactive.error.AbstractErrorWebExceptionHandler;
import org.springframework.boot.web.reactive.error.ErrorAttributes;
import org.springframework.context.ApplicationContext;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.codec.ServerCodecConfigurer;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.server.*;
import reactor.core.publisher.Mono;

import java.util.Map;

@Component
@Order(-2)
public class GlobalErrorWebExceptionHandler extends AbstractErrorWebExceptionHandler {

    public GlobalErrorWebExceptionHandler(ErrorAttributes errorAttributes, WebProperties webProperties, ApplicationContext applicationContext, ServerCodecConfigurer serverCodecConfigurer) {
        super(errorAttributes, webProperties.getResources(), applicationContext);
        this.setMessageWriters(serverCodecConfigurer.getWriters());
        this.setMessageReaders(serverCodecConfigurer.getReaders());
    }

    @Override
    protected RouterFunction<ServerResponse> getRoutingFunction(ErrorAttributes errorAttributes) {
        return RouterFunctions.route(RequestMatchers.all(), this::renderErrorResponse);
    }

    private Mono<ServerResponse> renderErrorResponse(ServerRequest request) {
        Throwable error = getError(request);
        Map<String, Object> errorProperties = getErrorAttributes(request, org.springframework.boot.web.error.ErrorAttributeOptions.defaults());
        
        HttpStatus status = HttpStatus.INTERNAL_SERVER_ERROR;
        String message = "Ocurrió un error interno en el servidor";

        if (error instanceof BadCredentialsException) {
            status = HttpStatus.UNAUTHORIZED;
            message = "Credenciales inválidas";
        } else if (error instanceof RuntimeException && error.getMessage() != null && error.getMessage().contains("Access Denied")) {
            status = HttpStatus.FORBIDDEN;
            message = "Acceso denegado";
        }

        errorProperties.put("status", status.value());
        errorProperties.put("message", message);
        errorProperties.put("error", status.getReasonPhrase());

        return ServerResponse.status(status)
                .contentType(MediaType.APPLICATION_JSON)
                .body(BodyInserters.fromValue(errorProperties));
    }
}
