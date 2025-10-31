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
public class SingStorageService implements StorageFileService{

    @Value("${sign.location}")
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
                throw new IllegalArgumentException("No se ha proporcionado ningún archivo.");
            }

            // Obtener el nombre del archivo y reemplazar espacios en blanco por guiones bajos
            String originalFilename = file.getOriginalFilename();
            if (originalFilename == null) {
                throw new IllegalArgumentException("El archivo no tiene un nombre válido.");
            }
            String sanitizedFilename = originalFilename.replaceAll("\\s+", "_");

            // Construir la ruta de destino
            Path destinationFile = rootLocation.resolve(Paths.get(sanitizedFilename))
                    .normalize().toAbsolutePath();

            // Copiar el archivo al almacenamiento
            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, destinationFile, StandardCopyOption.REPLACE_EXISTING);
            }

            return sanitizedFilename;

        } catch (IOException e) {
            throw new RuntimeException("Error al cargar el archivo. Asegúrate de que el archivo sea accesible.", e);
        } catch (IllegalArgumentException e) {
            throw e;  // Relanzar para errores de validación específicos
        }
    }


    @Override
    public Resource LoadAsResource(String filename) {
        try{
            Path file = rootLocation.resolve(filename);
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
