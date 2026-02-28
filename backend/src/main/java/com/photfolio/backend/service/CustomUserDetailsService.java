package com.photfolio.backend.service;

import com.photfolio.backend.model.User;
import com.photfolio.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class CustomUserDetailsService implements UserDetailsService {

  @Autowired
  private UserRepository userRepository;

  @Override
  public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
    String normalizedEmail = email.trim().toLowerCase();
    User user = userRepository.findByEmail(normalizedEmail)
        .orElseThrow(() -> new UsernameNotFoundException("User not found: " + normalizedEmail));
    return new CustomUserDetails(user.getEmail(), user.getPassword(), user.getRole(), user.isEnabled());
  }

  public void saveUser(String email, String encodedPassword) {
    User user = new User(email.trim().toLowerCase(), encodedPassword, User.ROLE_ADMIN, User.APPROVAL_APPROVED);
    userRepository.save(user);
  }

  public void saveUser(User user) {
    userRepository.save(user);
  }

  public boolean userExists(String email) {
    return userRepository.existsByEmail(email.trim().toLowerCase());
  }

  public User getUserOrThrow(String email) {
    String normalizedEmail = email.trim().toLowerCase();
    return userRepository.findByEmail(normalizedEmail)
        .orElseThrow(() -> new UsernameNotFoundException("User not found: " + normalizedEmail));
  }

  public void updatePassword(String email, String encodedPassword) {
    User user = getUserOrThrow(email);
    user.setPassword(encodedPassword);
    userRepository.save(user);
  }
}
