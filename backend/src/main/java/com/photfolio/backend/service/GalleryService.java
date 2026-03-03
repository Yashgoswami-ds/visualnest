package com.photfolio.backend.service;

import com.photfolio.backend.model.ImageDto;
import com.photfolio.backend.repository.ImageRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.*;

@Service
public class GalleryService {

  private static final String STORAGE_PROVIDER_LOCAL = "local";
  private static final String STORAGE_PROVIDER_SUPABASE = "supabase";

  @Autowired
  private ImageRepository imageRepository;

  @Value("${app.storage.provider:local}")
  private String storageProvider;

  @Value("${app.storage.uploadDir}")
  private String uploadDir;

  @Value("${app.baseUrl:}")
  private String appBaseUrl;

  @Value("${app.storage.supabase.url:}")
  private String supabaseUrl;

  @Value("${app.storage.supabase.serviceKey:}")
  private String supabaseServiceKey;

  @Value("${app.storage.supabase.bucket:}")
  private String supabaseBucket;

  @Value("${app.storage.supabase.folder:gallery}")
  private String supabaseFolder;

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
    ImageDto image = imageRepository.findById(safeId)
        .orElseThrow(() -> new RuntimeException("Image not found"));

    deleteStoredMediaIfPossible(image.getUrl());
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

      ImageDto imageDto = new ImageDto();
      imageDto.setId(UUID.randomUUID().toString());
      imageDto.setTitle((title == null || title.isBlank()) ? sanitizedName : title);
      imageDto.setCategory((category == null || category.isBlank()) ? "general" : category);
      imageDto.setMediaType(contentType);
      imageDto.setMediaKind(resolveMediaKind(contentType));
      imageDto.setSection(resolveSection(imageDto.getCategory()));
      imageDto.setCreatedAt(Instant.now());
      imageDto.setUpdatedAt(Instant.now());
      imageDto.setUrl(storeMediaAndGetUrl(file, storedName, contentType));

      return imageRepository.save(imageDto);
    } catch (Exception e) {
      throw new RuntimeException("Media upload failed", e);
    }
  }

  private String storeMediaAndGetUrl(MultipartFile file, String storedName, String contentType) throws IOException {
    if (isSupabaseProviderEnabled()) {
      return uploadToSupabase(file, storedName, contentType);
    }

    Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
    Files.createDirectories(uploadPath);
    Path targetPath = uploadPath.resolve(storedName);
    Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
    return buildPublicUploadUrl(storedName);
  }

  private boolean isSupabaseProviderEnabled() {
    return STORAGE_PROVIDER_SUPABASE.equalsIgnoreCase(Objects.requireNonNullElse(storageProvider, STORAGE_PROVIDER_LOCAL).trim());
  }

  private String uploadToSupabase(MultipartFile file, String storedName, String contentType) throws IOException {
    validateSupabaseConfig();

    String objectPath = buildSupabaseObjectPath(storedName);
    String encodedBucket = encodePathSegment(supabaseBucket.trim());
    String encodedObjectPath = encodePath(objectPath);
    String endpoint = normalizeSupabaseBaseUrl() + "/storage/v1/object/" + encodedBucket + "/" + encodedObjectPath;

    HttpURLConnection connection = (HttpURLConnection) new URL(endpoint).openConnection();
    connection.setRequestMethod("POST");
    connection.setDoOutput(true);
    connection.setRequestProperty("Authorization", "Bearer " + supabaseServiceKey.trim());
    connection.setRequestProperty("apikey", supabaseServiceKey.trim());
    connection.setRequestProperty("x-upsert", "true");
    connection.setRequestProperty("Content-Type", contentType);

    try (OutputStream outputStream = connection.getOutputStream()) {
      outputStream.write(file.getBytes());
    }

    int status = connection.getResponseCode();
    if (status < 200 || status >= 300) {
      throw new RuntimeException("Supabase upload failed with status " + status + ": " + readErrorBody(connection));
    }

    return normalizeSupabaseBaseUrl() + "/storage/v1/object/public/" + encodedBucket + "/" + encodedObjectPath;
  }

  private void deleteStoredMediaIfPossible(String url) {
    String mediaUrl = url == null ? "" : url.trim();
    if (mediaUrl.isBlank()) {
      return;
    }

    if (mediaUrl.startsWith("/uploads/")) {
      deleteLocalUploadedMedia(mediaUrl);
      return;
    }

    if (isSupabaseProviderEnabled()) {
      String objectPath = extractSupabaseObjectPath(mediaUrl);
      if (!objectPath.isBlank()) {
        deleteFromSupabase(objectPath);
      }
    }
  }

  private void deleteLocalUploadedMedia(String mediaUrl) {
    String fileName = mediaUrl.substring("/uploads/".length());
    int queryIndex = fileName.indexOf('?');
    if (queryIndex >= 0) {
      fileName = fileName.substring(0, queryIndex);
    }

    int hashIndex = fileName.indexOf('#');
    if (hashIndex >= 0) {
      fileName = fileName.substring(0, hashIndex);
    }

    if (fileName.isBlank()) {
      return;
    }

    try {
      Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
      Path mediaPath = uploadPath.resolve(fileName).normalize();
      if (mediaPath.startsWith(uploadPath)) {
        Files.deleteIfExists(mediaPath);
      }
    } catch (Exception ignored) {
    }
  }

  private void deleteFromSupabase(String objectPath) {
    try {
      validateSupabaseConfig();
      String encodedBucket = encodePathSegment(supabaseBucket.trim());
      String encodedObjectPath = encodePath(objectPath);
      String endpoint = normalizeSupabaseBaseUrl() + "/storage/v1/object/" + encodedBucket + "/" + encodedObjectPath;

      HttpURLConnection connection = (HttpURLConnection) new URL(endpoint).openConnection();
      connection.setRequestMethod("DELETE");
      connection.setRequestProperty("Authorization", "Bearer " + supabaseServiceKey.trim());
      connection.setRequestProperty("apikey", supabaseServiceKey.trim());

      int status = connection.getResponseCode();
      if (status == 404 || (status >= 200 && status < 300)) {
        return;
      }
      throw new RuntimeException("Supabase delete failed with status " + status + ": " + readErrorBody(connection));
    } catch (Exception ignored) {
    }
  }

  private String extractSupabaseObjectPath(String mediaUrl) {
    try {
      validateSupabaseConfig();
      URI uri = URI.create(mediaUrl);
      String path = Objects.requireNonNullElse(uri.getPath(), "");
      String bucket = supabaseBucket.trim();
      String prefix = "/storage/v1/object/public/" + bucket + "/";
      if (!path.startsWith(prefix)) {
        return "";
      }
      String encodedPath = path.substring(prefix.length());
      if (encodedPath.isBlank()) {
        return "";
      }
      return URLDecoder.decode(encodedPath, StandardCharsets.UTF_8);
    } catch (Exception ignored) {
      return "";
    }
  }

  private void validateSupabaseConfig() {
    if (supabaseUrl == null || supabaseUrl.isBlank()) {
      throw new RuntimeException("Missing app.storage.supabase.url configuration");
    }
    if (supabaseServiceKey == null || supabaseServiceKey.isBlank()) {
      throw new RuntimeException("Missing app.storage.supabase.serviceKey configuration");
    }
    if (supabaseBucket == null || supabaseBucket.isBlank()) {
      throw new RuntimeException("Missing app.storage.supabase.bucket configuration");
    }
  }

  private String buildSupabaseObjectPath(String storedName) {
    String folder = Objects.requireNonNullElse(supabaseFolder, "").trim();
    if (folder.startsWith("/")) {
      folder = folder.substring(1);
    }
    while (folder.endsWith("/")) {
      folder = folder.substring(0, folder.length() - 1);
    }
    if (folder.isBlank()) {
      return storedName;
    }
    return folder + "/" + storedName;
  }

  private String encodePath(String path) {
    String[] segments = path.split("/");
    StringBuilder encoded = new StringBuilder();
    for (int i = 0; i < segments.length; i++) {
      if (i > 0) {
        encoded.append('/');
      }
      encoded.append(encodePathSegment(segments[i]));
    }
    return encoded.toString();
  }

  private String encodePathSegment(String value) {
    return URLEncoder.encode(value, StandardCharsets.UTF_8).replace("+", "%20");
  }

  private String normalizeSupabaseBaseUrl() {
    String base = supabaseUrl == null ? "" : supabaseUrl.trim();
    while (base.endsWith("/")) {
      base = base.substring(0, base.length() - 1);
    }
    return base;
  }

  private String readErrorBody(HttpURLConnection connection) {
    try (InputStream errorStream = connection.getErrorStream()) {
      if (errorStream == null) {
        return "";
      }
      return new String(errorStream.readAllBytes(), StandardCharsets.UTF_8);
    } catch (Exception ignored) {
      return "";
    }
  }

  private List<ImageDto> normalizeMediaRecords(List<ImageDto> records) {
    List<ImageDto> normalized = new ArrayList<>();
    for (ImageDto record : records) {
      boolean changed = false;

      String canonicalUrl = canonicalizeUploadUrl(record.getUrl());
      if (!Objects.equals(canonicalUrl, record.getUrl())) {
        record.setUrl(canonicalUrl);
        changed = true;
      }

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

      if (!isMediaFileAvailable(record.getUrl())) {
        continue;
      }

      normalized.add(record);
    }
    return normalized;
  }

  private String canonicalizeUploadUrl(String url) {
    String raw = url == null ? "" : url.trim();
    if (raw.isEmpty() || raw.startsWith("/uploads/")) {
      return raw;
    }

    try {
      java.net.URI uri = java.net.URI.create(raw);
      String path = uri.getPath();
      if (path != null && path.startsWith("/uploads/")) {
        String query = uri.getQuery();
        String fragment = uri.getFragment();
        StringBuilder output = new StringBuilder(path);
        if (query != null && !query.isBlank()) {
          output.append("?").append(query);
        }
        if (fragment != null && !fragment.isBlank()) {
          output.append("#").append(fragment);
        }
        return output.toString();
      }
    } catch (Exception ignored) {
      // keep original if not a parsable absolute url
    }

    return raw;
  }

  private boolean isMediaFileAvailable(String url) {
    String mediaUrl = url == null ? "" : url.trim();
    if (!mediaUrl.startsWith("/uploads/")) {
      return true;
    }

    String fileName = mediaUrl.substring("/uploads/".length());
    int queryIndex = fileName.indexOf('?');
    if (queryIndex >= 0) {
      fileName = fileName.substring(0, queryIndex);
    }

    int hashIndex = fileName.indexOf('#');
    if (hashIndex >= 0) {
      fileName = fileName.substring(0, hashIndex);
    }

    if (fileName.isBlank()) {
      return false;
    }

    try {
      Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
      Path mediaPath = uploadPath.resolve(fileName).normalize();
      if (!mediaPath.startsWith(uploadPath)) {
        return false;
      }
      return Files.exists(mediaPath);
    } catch (Exception ignored) {
      return false;
    }
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
