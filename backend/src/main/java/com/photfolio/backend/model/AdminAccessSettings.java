package com.photfolio.backend.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "admin_access_settings")
public class AdminAccessSettings {
  @Id
  private String id = "global";

  private int maxApprovedAdmins = 3;

  public String getId() {
    return id;
  }

  public void setId(String id) {
    this.id = id;
  }

  public int getMaxApprovedAdmins() {
    return maxApprovedAdmins;
  }

  public void setMaxApprovedAdmins(int maxApprovedAdmins) {
    this.maxApprovedAdmins = maxApprovedAdmins;
  }
}
