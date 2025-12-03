package com.app.starter1.utils;

import com.app.starter1.persistence.entity.UserEntity;
import com.app.starter1.persistence.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class UserMethods {

    private final UserRepository userRepository;

    /**
     * Get the tenant ID of the currently authenticated user.
     * The tenant ID is the customer ID associated with the user.
     *
     * @return The tenant ID (customer ID) of the current user
     * @throws IllegalStateException if no user is authenticated or user has no
     *                               customer
     */
    public Long getTenantId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalStateException("No authenticated user found");
        }

        String username = authentication.getName();

        UserEntity user = userRepository.findUserEntityByUsername(username)
                .orElseThrow(() -> new IllegalStateException("User not found: " + username));

        if (user.getCustomer() == null) {
            throw new IllegalStateException("User does not have an associated customer/tenant");
        }

        return user.getCustomer().getId();
    }

    /**
     * Get the currently authenticated user.
     *
     * @return The current UserEntity
     * @throws IllegalStateException if no user is authenticated
     */
    public UserEntity getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalStateException("No authenticated user found");
        }

        String username = authentication.getName();

        return userRepository.findUserEntityByUsername(username)
                .orElseThrow(() -> new IllegalStateException("User not found: " + username));
    }
}
