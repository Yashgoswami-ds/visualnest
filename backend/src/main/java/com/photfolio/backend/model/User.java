package com.photfolio.backend.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

import java.time.Instant;

@Document(collection = "users")
public class User {
  public static final String ROLE_SUPER_ADMIN = "SUPER_ADMIN";
  public static final String ROLE_ADMIN = "ADMIN";
  public static final String APPROVAL_PENDING = "PENDING";
  public static final String APPROVAL_APPROVED = "APPROVED";
  public static final String APPROVAL_REJECTED = "REJECTED";

  @Id
  private String id;

  @Email
  @NotBlank
  private String email;

  private String name;

  @NotBlank
  private String password;

  private boolean enabled = true;

  private String role = ROLE_ADMIN;

  private String approvalStatus = APPROVAL_APPROVED;

  private Instant requestedAt;

  private Instant approvedAt;

  private long sessionVersion = 0L;

  public User() {}

  public User(String email, String password) {
    this.email = email;
    this.password = password;
  }

  public User(String email, String password, String role, String approvalStatus) {
    this.email = email;
    this.password = password;
    this.role = role;
    this.approvalStatus = approvalStatus;
  }

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public String getEmail() {
    return email;
  }

  public void setEmail(String email) {
    this.email = email;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public String getPassword() {
    return password;
  }

  public void setPassword(String password) {
    this.password = password;
  }

  public boolean isEnabled() {
    return enabled;
  }

  public void setEnabled(boolean enabled) {
    this.enabled = enabled;
  }

  public String getRole() {
    return role;
  }

  public void setRole(String role) {
    this.role = role;
  }

  public String getApprovalStatus() {
    return approvalStatus;
  }

  public void setApprovalStatus(String approvalStatus) {
    this.approvalStatus = approvalStatus;
  }

  public Instant getRequestedAt() {
    return requestedAt;
  }

  public void setRequestedAt(Instant requestedAt) {
    this.requestedAt = requestedAt;
  }

  public Instant getApprovedAt() {
    return approvedAt;
  }

  public void setApprovedAt(Instant approvedAt) {
    this.approvedAt = approvedAt;
  }

  public long getSessionVersion() {
    return sessionVersion;
  }

  public void setSessionVersion(long sessionVersion) {
    this.sessionVersion = sessionVersion;
  }

  public boolean isApproved() {
    if (approvalStatus == null || approvalStatus.isBlank()) {
      return true;
    }
    return APPROVAL_APPROVED.equalsIgnoreCase(approvalStatus);
  }

  public boolean isSuperAdmin() {
    return ROLE_SUPER_ADMIN.equalsIgnoreCase(role);
  }
}
