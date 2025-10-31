package com.app.starter1.persistence.services;


import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

@Service
public class FileSystemStorageService  implements StorageService{

    @Value("${media.location}")
    private String mediaLocation;

    private Path rootLocation;


    @Override
    @PostConstruct
    public void init() throws IOException {
        rootLocation = Paths.get(mediaLocation);
        Files.createDirectories(rootLocation);
    }

    @Override
    public String Store(MultipartFile file) {

        try {
            if (file.isEmpty()) {
                throw new RuntimeException("No existe archivo");
            }

            String filename = file.getOriginalFilename();
            Path destinationFile = rootLocation.resolve(Paths.get(filename))
                    .normalize().toAbsolutePath();

            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, destinationFile, StandardCopyOption.REPLACE_EXISTING);
            }

            return filename;

        }catch (IOException e){

            throw new RuntimeException("Error al cargar fichero");
        }

    }

    @Override
    public Resource LoadAsResource(String filename) {

        System.out.println(filename);

        try{
            Path file = rootLocation.resolve(filename);
            System.out.println(file.toUri());
            Resource resource = new UrlResource((file.toUri()));

            if(resource.exists() || resource.isReadable()){
                return resource;
            }else{

                throw new RuntimeException("Could no read file");
            }

        }catch (MalformedURLException e){

            throw new RuntimeException("Could no read file");

        }
    }


    public void delete(String filename) {
        try {
            Path fileToDelete = rootLocation.resolve(filename).normalize().toAbsolutePath();

            if (Files.exists(fileToDelete)) {
                Files.delete(fileToDelete);
            } else {
                throw new RuntimeException("El archivo no existe: " + filename);
            }
        } catch (IOException e) {
            throw new RuntimeException("Error al intentar eliminar el archivo: " + filename, e);
        }
    }


}
