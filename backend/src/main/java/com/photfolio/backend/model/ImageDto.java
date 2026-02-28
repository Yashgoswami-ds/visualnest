package com.photfolio.backend.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "images")
public class ImageDto {
  @Id
  private String id;
  private String url;
  private String title;
  @Indexed
  private String category;
  @Indexed
  private String mediaType;
  @Indexed
  private String mediaKind;
  @Indexed
  private String section;
  private Instant createdAt;
  private Instant updatedAt;

  public ImageDto() {}

  public ImageDto(String id, String url, String title, String category, String mediaType) {
    this.id = id;
    this.url = url;
    this.title = title;
    this.category = category;
    this.mediaType = mediaType;
  }

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public String getUrl() {
    return url;
  }

  public void setUrl(String url) {
    this.url = url;
  }

  public String getTitle() {
    return title;
  }

  public void setTitle(String title) {
    this.title = title;
  }

  public String getCategory() {
    return category;
  }

  public void setCategory(String category) {
    this.category = category;
  }

  public String getMediaType() {
    return mediaType;
  }

  public void setMediaType(String mediaType) {
    this.mediaType = mediaType;
  }

  public String getMediaKind() {
    return mediaKind;
  }

  public void setMediaKind(String mediaKind) {
    this.mediaKind = mediaKind;
  }

  public String getSection() {
    return section;
  }

  public void setSection(String section) {
    this.section = section;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(Instant createdAt) {
    this.createdAt = createdAt;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }

  public void setUpdatedAt(Instant updatedAt) {
    this.updatedAt = updatedAt;
  }
}
