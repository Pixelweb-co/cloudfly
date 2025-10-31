package com.app.starter1.persistence.services;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

public interface StorageService {
    void init() throws IOException;
    String Store (MultipartFile file);
    Resource LoadAsResource(String filename);
    void delete(String filename);
}
