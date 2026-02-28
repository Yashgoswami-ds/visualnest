package com.photfolio.backend.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "contact_content")
public class ContactContent {

  @Id
  private String id;
  private String location;
  private String email;
  private String phone;
  private String instagram;

  public ContactContent() {
  }

  public ContactContent(String id, String location, String email, String phone, String instagram) {
    this.id = id;
    this.location = location;
    this.email = email;
    this.phone = phone;
    this.instagram = instagram;
  }

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public String getLocation() {
    return location;
  }

  public void setLocation(String location) {
    this.location = location;
  }

  public String getEmail() {
    return email;
  }

  public void setEmail(String email) {
    this.email = email;
  }

  public String getPhone() {
    return phone;
  }

  public void setPhone(String phone) {
    this.phone = phone;
  }

  public String getInstagram() {
    return instagram;
  }

  public void setInstagram(String instagram) {
    this.instagram = instagram;
  }
}
