package com.photfolio.backend.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "about_content")
public class AboutContent {

  @Id
  private String id;
  private String name;
  private String experience;
  private String projects;
  private String location;
  private String equipment;
  private String adminPhotoUrl;
  private String adminVideoUrl;

  public AboutContent() {
  }

  public AboutContent(String id, String name, String experience, String projects, String location, String equipment) {
    this.id = id;
    this.name = name;
    this.experience = experience;
    this.projects = projects;
    this.location = location;
    this.equipment = equipment;
  }

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public String getExperience() {
    return experience;
  }

  public void setExperience(String experience) {
    this.experience = experience;
  }

  public String getProjects() {
    return projects;
  }

  public void setProjects(String projects) {
    this.projects = projects;
  }

  public String getLocation() {
    return location;
  }

  public void setLocation(String location) {
    this.location = location;
  }

  public String getEquipment() {
    return equipment;
  }

  public void setEquipment(String equipment) {
    this.equipment = equipment;
  }

  public String getAdminPhotoUrl() {
    return adminPhotoUrl;
  }

  public void setAdminPhotoUrl(String adminPhotoUrl) {
    this.adminPhotoUrl = adminPhotoUrl;
  }

  public String getAdminVideoUrl() {
    return adminVideoUrl;
  }

  public void setAdminVideoUrl(String adminVideoUrl) {
    this.adminVideoUrl = adminVideoUrl;
  }
}
