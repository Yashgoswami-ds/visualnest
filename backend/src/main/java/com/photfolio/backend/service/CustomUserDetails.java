package com.photfolio.backend.service;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import java.util.Collection;
import java.util.Collections;

public class CustomUserDetails implements UserDetails {

  private final String email;
  private final String password;
  private final String role;
  private final boolean enabled;

  public CustomUserDetails(String email, String password, String role, boolean enabled) {
    this.email = email;
    this.password = password;
    this.role = role;
    this.enabled = enabled;
  }

  @Override
  public Collection<? extends GrantedAuthority> getAuthorities() {
    String normalizedRole = (role == null || role.isBlank()) ? "ADMIN" : role.toUpperCase();
    return Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + normalizedRole));
  }

  @Override
  public String getPassword() {
    return password;
  }

  @Override
  public String getUsername() {
    return email;
  }

  @Override
  public boolean isAccountNonExpired() {
    return true;
  }

  @Override
  public boolean isAccountNonLocked() {
    return true;
  }

  @Override
  public boolean isCredentialsNonExpired() {
    return true;
  }

  @Override
  public boolean isEnabled() {
    return enabled;
  }
}
