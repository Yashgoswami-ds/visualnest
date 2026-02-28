package com.photfolio.backend.config;

import com.photfolio.backend.model.User;
import com.photfolio.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;

@Configuration
public class DataInitializer {

  @Value("${app.admin.email:admin@photfolio.com}")
  private String defaultAdminEmail;

  @Value("${app.admin.password:admin123}")
  private String defaultAdminPassword;

  @Bean
  public CommandLineRunner initializeData(UserRepository userRepository, PasswordEncoder passwordEncoder) {
    return args -> {
      try {
        String normalizedAdminEmail = defaultAdminEmail.trim().toLowerCase();

        if (!userRepository.existsByEmail(normalizedAdminEmail)) {
          User admin = new User();
          admin.setEmail(normalizedAdminEmail);
          admin.setPassword(passwordEncoder.encode(defaultAdminPassword));
          admin.setEnabled(true);
          admin.setRole(User.ROLE_SUPER_ADMIN);
          admin.setApprovalStatus(User.APPROVAL_APPROVED);
          admin.setApprovedAt(Instant.now());
          userRepository.save(admin);

          System.out.println("\n✅ Super admin user created:");
          System.out.println("   Super Admin Email: " + defaultAdminEmail + " | Password: " + defaultAdminPassword + "\n");
        } else {
          User existingAdmin = userRepository.findByEmail(normalizedAdminEmail).orElse(null);
          if (existingAdmin != null) {
            existingAdmin.setEnabled(true);
            existingAdmin.setRole(User.ROLE_SUPER_ADMIN);
            existingAdmin.setApprovalStatus(User.APPROVAL_APPROVED);
            if (existingAdmin.getApprovedAt() == null) {
              existingAdmin.setApprovedAt(Instant.now());
            }
            userRepository.save(existingAdmin);
          }
        }
      } catch (Exception e) {
        e.printStackTrace();
      }
    };
  }
}
