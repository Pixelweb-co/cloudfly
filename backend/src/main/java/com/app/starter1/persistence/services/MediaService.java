package com.app.starter1.persistence.services;

import com.app.starter1.persistence.entity.Media;
import com.app.starter1.persistence.repository.MediaRepository;
import com.app.starter1.dto.MediaResponseDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class MediaService {

    @Value("${media.uploads-location}")
    private String uploadsLocation; // /app/uploads

    private final MediaRepository mediaRepository;

    public MediaService(MediaRepository mediaRepository) {
        this.mediaRepository = mediaRepository;
    }

    public List<MediaResponseDTO> uploadFiles(Long tenantId, List<MultipartFile> files) {

        if (tenantId == null) {
            throw new IllegalArgumentException("tenantId es obligatorio");
        }

        List<MediaResponseDTO> response = new ArrayList<>();

        try {
            // /app/uploads/{tenantId}
            Path tenantDir = Paths.get(uploadsLocation, String.valueOf(tenantId))
                    .normalize()
                    .toAbsolutePath();

            Files.createDirectories(tenantDir);

            for (MultipartFile file : files) {
                if (file.isEmpty()) {
                    continue;
                }

                String originalFilename = file.getOriginalFilename();
                if (originalFilename == null) {
                    originalFilename = "unnamed";
                }

                // Sanitizar y hacer único el nombre
                String sanitized = originalFilename.replaceAll("\\s+", "_");
                String extension = "";

                int dotIndex = sanitized.lastIndexOf('.');
                if (dotIndex != -1) {
                    extension = sanitized.substring(dotIndex);
                    sanitized = sanitized.substring(0, dotIndex);
                }

                String uniqueName = sanitized + "_" + UUID.randomUUID() + extension;

                Path destination = tenantDir.resolve(uniqueName).normalize().toAbsolutePath();

                Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);

                // Guardar en BD
                Media media = new Media();
                media.setTenantId(tenantId);
                media.setFilename(uniqueName);
                media.setOriginalFilename(originalFilename);
                media.setContentType(file.getContentType());
                media.setSize(file.getSize());
                // ruta relativa para servirlo: /uploads/{tenantId}/{filename}
                media.setPath("/uploads/" + tenantId + "/" + uniqueName);

                Media saved = mediaRepository.save(media);

                // aquí la URL pública la puedes construir como quieras, por ejemplo:
                String url = media.getPath(); // si traefik sirve /uploads directamente

                response.add(new MediaResponseDTO(
                        saved.getId(),
                        saved.getTenantId(),
                        saved.getFilename(),
                        saved.getOriginalFilename(),
                        url,
                        saved.getSize(),
                        saved.getContentType(),
                        saved.getCreatedAt()
                ));
            }

            return response;

        } catch (IOException e) {
            throw new RuntimeException("Error al guardar archivos de media", e);
        }
    }

    public List<MediaResponseDTO> listByTenant(Long tenantId) {
        List<Media> medias = mediaRepository.findByTenantId(tenantId);
        List<MediaResponseDTO> list = new ArrayList<>();

        for (Media m : medias) {
            list.add(new MediaResponseDTO(
                    m.getId(),
                    m.getTenantId(),
                    m.getFilename(),
                    m.getOriginalFilename(),
                    m.getPath(),
                    m.getSize(),
                    m.getContentType(),
                    m.getCreatedAt()
            ));
        }

        return list;
    }
}
