package com.photfolio.backend.model;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class PasswordResetOtpRequest {

  @NotBlank
  @Email
  private String email;

  @NotBlank
  @Pattern(regexp = "^\\d{6}$", message = "OTP must be 6 digits")
  private String otp;

  @NotBlank
  @Size(min = 6, message = "Password must be at least 6 characters")
  private String newPassword;

  public String getEmail() {
    return email;
  }

  public void setEmail(String email) {
    this.email = email;
  }

  public String getOtp() {
    return otp;
  }

  public void setOtp(String otp) {
    this.otp = otp;
  }

  public String getNewPassword() {
    return newPassword;
  }

  public void setNewPassword(String newPassword) {
    this.newPassword = newPassword;
  }
}
