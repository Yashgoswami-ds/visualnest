package com.photfolio.backend.model;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class RegistrationOtpRequest {

  @NotBlank(message = "Name is required")
  private String name;

  @Email(message = "Please enter a valid email")
  @NotBlank(message = "Email is required")
  private String email;

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public String getEmail() {
    return email;
  }

  public void setEmail(String email) {
    this.email = email;
  }
}
