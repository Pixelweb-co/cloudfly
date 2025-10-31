package com.app.starter1.persistence.services;

import com.app.starter1.persistence.entity.UserEntity;
import com.app.starter1.persistence.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class VerificationTokenService {

    @Autowired
    private UserRepository userRepository;

    public void createVerificationToken(UserEntity user, String token) {
        user.setVerificationToken(token);
        userRepository.save(user);
    }

    public String validateVerificationToken(String token) {
        UserEntity user = userRepository.findByVerificationToken(token).orElse(null);
        if (user == null) {
            return "invalid";
        }

        user.setEnabled(true);
        user.setVerificationToken("");
        userRepository.save(user);
        return "valid";
    }
}
