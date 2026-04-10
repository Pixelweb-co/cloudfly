package com.app.services.storage;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class FileSystemStorageService implements StorageService {

    private final Path rootLocation;

    public FileSystemStorageService(@Value("${app.storage.location:/uploads}") String location) {
        this.rootLocation = Paths.get(location);
    }

    @Override
    @PostConstruct
    public void init() {
        try {
            if (!Files.exists(rootLocation)) {
                Files.createDirectories(rootLocation);
            }
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize storage", e);
        }
    }

    @Override
    public Mono<String> store(FilePart file, Long tenantId) {
        String originalFilename = file.filename();
        String extension = "";
        int i = originalFilename.lastIndexOf('.');
        if (i > 0) {
            extension = originalFilename.substring(i);
        }
        
        String filename = UUID.randomUUID().toString() + extension;
        Path tenantPath = rootLocation.resolve(tenantId.toString());

        try {
            if (!Files.exists(tenantPath)) {
                Files.createDirectories(tenantPath);
            }
        } catch (IOException e) {
            return Mono.error(new RuntimeException("Could not create tenant directory", e));
        }

        Path destinationFile = tenantPath.resolve(filename);
        
        return file.transferTo(destinationFile)
                .then(Mono.just(filename));
    }

    @Override
    public Path load(String filename, Long tenantId) {
        return rootLocation.resolve(tenantId.toString()).resolve(filename);
    }

    @Override
    public Mono<Void> delete(String filename, Long tenantId) {
        try {
            Files.deleteIfExists(load(filename, tenantId));
            return Mono.empty();
        } catch (IOException e) {
            return Mono.error(new RuntimeException("Could not delete file", e));
        }
    }
}
