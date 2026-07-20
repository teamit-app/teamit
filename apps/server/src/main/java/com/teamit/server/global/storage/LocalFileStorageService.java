package com.teamit.server.global.storage;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

@Service
public class LocalFileStorageService implements FileStorageService {

    private final Path root;

    public LocalFileStorageService(@Value("${file.upload-dir}") String uploadDir) {
        this.root = Path.of(uploadDir).toAbsolutePath().normalize();
    }

    @Override
    public String store(MultipartFile file, String subDir) {
        try {
            Path dir = root.resolve(subDir).normalize();
            Files.createDirectories(dir);

            String storedFileName = UUID.randomUUID() + extensionOf(file.getOriginalFilename());
            Path target = dir.resolve(storedFileName);
            file.transferTo(target);
            return storedFileName;
        } catch (IOException e) {
            throw new IllegalStateException("파일 저장에 실패했습니다", e);
        }
    }

    @Override
    public Resource load(String subDir, String storedFileName) {
        Path file = root.resolve(subDir).resolve(storedFileName).normalize();
        if (!file.startsWith(root)) {
            // 경로 조작(../) 방지
            throw new IllegalArgumentException("잘못된 파일 경로입니다");
        }
        try {
            Resource resource = new UrlResource(file.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                throw new IllegalArgumentException("파일을 찾을 수 없습니다");
            }
            return resource;
        } catch (MalformedURLException e) {
            throw new IllegalArgumentException("파일을 찾을 수 없습니다", e);
        }
    }

    private String extensionOf(String originalFileName) {
        if (originalFileName == null) return "";
        int dot = originalFileName.lastIndexOf('.');
        return dot >= 0 ? originalFileName.substring(dot) : "";
    }
}
