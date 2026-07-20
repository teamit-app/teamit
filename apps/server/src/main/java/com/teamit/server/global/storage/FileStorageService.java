package com.teamit.server.global.storage;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

/**
 * 업로드 파일 저장소. 지금은 로컬 디스크 구현체(LocalFileStorageService)만 있지만,
 * 나중에 S3 등 클라우드 저장소로 교체할 때 이 인터페이스만 구현하면 되도록 분리했다.
 */
public interface FileStorageService {

    /** 파일을 저장하고, 저장된 파일명(원본 파일명이 아닌 충돌 방지용 생성 파일명)을 반환한다. */
    String store(MultipartFile file, String subDir);

    /** 저장된 파일을 읽어온다. */
    Resource load(String subDir, String storedFileName);
}
