package com.photfolio.backend.service;

import com.photfolio.backend.model.ImageDto;
import com.photfolio.backend.repository.ImageRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.*;

@Service
public class GalleryService {

  @Autowired
  private ImageRepository imageRepository;

  @Value("${app.storage.uploadDir}")
  private String uploadDir;

  @Value("${app.baseUrl:}")
  private String appBaseUrl;

  public GalleryService() {
    // Constructor for Spring
  }

  public List<ImageDto> getAllImages() {
    return normalizeMediaRecords(imageRepository.findAll());
  }

  public List<ImageDto> getOnlyImages() {
    return normalizeMediaRecords(imageRepository.findByMediaKind("image"));
  }

  public List<ImageDto> getOnlyVideos() {
    return normalizeMediaRecords(imageRepository.findByMediaKind("video"));
  }

  public List<ImageDto> getImagesByCategory(String category) {
    return normalizeMediaRecords(imageRepository.findByCategory(category));
  }

  public List<ImageDto> getByCollection(String section) {
    return normalizeMediaRecords(imageRepository.findBySection(section));
  }

  public List<ImageDto> getByCollectionAndMediaKind(String section, String mediaKind) {
    return normalizeMediaRecords(imageRepository.findBySectionAndMediaKind(section, mediaKind));
  }

  public ImageDto getLatestByCategory(String category) {
    ImageDto image = imageRepository.findFirstByCategoryOrderByUpdatedAtDesc(category);
    if (image == null) {
      return null;
    }
    List<ImageDto> normalized = normalizeMediaRecords(Collections.singletonList(image));
    return normalized.isEmpty() ? null : normalized.get(0);
  }

  public ImageDto addImage(ImageDto imageDto) {
    if (imageDto.getId() == null || imageDto.getId().isEmpty()) {
      imageDto.setId(UUID.randomUUID().toString());
    }
    return imageRepository.save(imageDto);
  }

  public ImageDto updateImage(String id, ImageDto imageDto) {
    String safeId = Objects.requireNonNull(id, "id is required");
    return imageRepository.findById(safeId)
        .map(img -> {
          img.setUrl(imageDto.getUrl());
          img.setTitle(imageDto.getTitle());
          img.setCategory(imageDto.getCategory());
          if (imageDto.getMediaType() != null && !imageDto.getMediaType().isBlank()) {
            img.setMediaType(imageDto.getMediaType());
          }
          img.setMediaKind(resolveMediaKind(img.getMediaType()));
          img.setSection(resolveSection(img.getCategory()));
          img.setUpdatedAt(Instant.now());
          return imageRepository.save(img);
        })
        .orElseThrow(() -> new RuntimeException("Image not found"));
  }

  public void deleteImage(String id) {
    String safeId = Objects.requireNonNull(id, "id is required");
    if (!imageRepository.existsById(safeId)) {
      throw new RuntimeException("Image not found");
    }
    imageRepository.deleteById(safeId);
  }

  public ImageDto uploadImage(MultipartFile file, String title, String category) {
    try {
      if (file == null || file.isEmpty()) {
        throw new RuntimeException("File is required");
      }

      String contentType = Objects.requireNonNullElse(file.getContentType(), "");
      if (!contentType.startsWith("image/") && !contentType.startsWith("video/")) {
        throw new RuntimeException("Only image and video files are supported");
      }

      String originalName = Objects.requireNonNullElse(file.getOriginalFilename(), "media");
      String sanitizedName = originalName.replaceAll("[^a-zA-Z0-9._-]", "_");
      String storedName = UUID.randomUUID() + "-" + sanitizedName;

      Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
      Files.createDirectories(uploadPath);

      Path targetPath = uploadPath.resolve(storedName);
      Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

      ImageDto imageDto = new ImageDto();
      imageDto.setId(UUID.randomUUID().toString());
      imageDto.setTitle((title == null || title.isBlank()) ? sanitizedName : title);
      imageDto.setCategory((category == null || category.isBlank()) ? "general" : category);
      imageDto.setMediaType(contentType);
      imageDto.setMediaKind(resolveMediaKind(contentType));
      imageDto.setSection(resolveSection(imageDto.getCategory()));
      imageDto.setCreatedAt(Instant.now());
      imageDto.setUpdatedAt(Instant.now());
      imageDto.setUrl(buildPublicUploadUrl(storedName));

      return imageRepository.save(imageDto);
    } catch (Exception e) {
      throw new RuntimeException("Media upload failed", e);
    }
  }

  private List<ImageDto> normalizeMediaRecords(List<ImageDto> records) {
    List<ImageDto> normalized = new ArrayList<>();
    for (ImageDto record : records) {
      boolean changed = false;

      if (record.getMediaKind() == null || record.getMediaKind().isBlank()) {
        record.setMediaKind(resolveMediaKind(record.getMediaType()));
        changed = true;
      }

      if (record.getSection() == null || record.getSection().isBlank()) {
        record.setSection(resolveSection(record.getCategory()));
        changed = true;
      }

      if (record.getCreatedAt() == null) {
        record.setCreatedAt(Instant.now());
        changed = true;
      }

      if (record.getUpdatedAt() == null) {
        record.setUpdatedAt(record.getCreatedAt());
        changed = true;
      }

      if (changed) {
        record = imageRepository.save(record);
      }

      normalized.add(record);
    }
    return normalized;
  }

  private String resolveMediaKind(String mediaType) {
    String type = mediaType == null ? "" : mediaType.toLowerCase();
    if (type.startsWith("video/")) {
      return "video";
    }
    return "image";
  }

  private String buildPublicUploadUrl(String storedName) {
    String safeName = storedName == null ? "" : storedName.trim();
    if (safeName.isEmpty()) {
      return "/uploads/";
    }

    String base = appBaseUrl == null ? "" : appBaseUrl.trim();
    if (base.isEmpty()) {
      return "/uploads/" + safeName;
    }

    if (base.endsWith("/")) {
      base = base.substring(0, base.length() - 1);
    }

    return base + "/uploads/" + safeName;
  }

  private String resolveSection(String category) {
    String normalizedCategory = category == null ? "" : category.trim().toLowerCase();
    if (normalizedCategory.endsWith("-bg")) {
      return "background";
    }
    if ("home-first".equals(normalizedCategory)) {
      return "home";
    }
    if ("about-profile".equals(normalizedCategory)) {
      return "about-admin";
    }
    if ("about-video".equals(normalizedCategory)) {
      return "about-admin-video";
    }
    return "gallery";
  }
}
