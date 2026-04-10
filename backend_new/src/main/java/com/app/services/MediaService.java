package com.app.services;

import com.app.persistence.entity.Media;
import com.app.persistence.repository.MediaRepository;
import com.app.services.storage.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class MediaService {

    private final MediaRepository mediaRepository;
    private final StorageService storageService;

    public Flux<Media> getAllMedia(Long tenantId) {
        return mediaRepository.findAllByTenantId(tenantId);
    }

    public Flux<Media> searchMedia(Long tenantId, String query) {
        return mediaRepository.findAllByTenantIdAndFilenameContainingIgnoreCase(tenantId, query);
    }

    public Mono<Media> uploadMedia(FilePart file, Long tenantId) {
        String originalFilename = file.filename();
        String contentType = file.headers().getContentType() != null ? 
                file.headers().getContentType().toString() : "application/octet-stream";
        long size = file.headers().getContentLength() > 0 ? file.headers().getContentLength() : 0;

        return storageService.store(file, tenantId)
                .flatMap(filename -> {
                    String url = "/media/" + tenantId + "/" + filename;
                    
                    Media media = Media.builder()
                            .tenantId(tenantId)
                            .filename(filename)
                            .originalName(originalFilename)
                            .contentType(contentType)
                            .size(size)
                            .url(url)
                            .createdAt(LocalDateTime.now())
                            .build();
                    
                    return mediaRepository.save(media);
                });
    }

    public Mono<Void> deleteMedia(Long id, Long tenantId) {
        return mediaRepository.findById(id)
                .filter(media -> media.getTenantId().equals(tenantId))
                .flatMap(media -> storageService.delete(media.getFilename(), tenantId)
                        .then(mediaRepository.delete(media)));
    }
}
