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

  @Value("${app.admin.email:}")
  private String defaultAdminEmail;

  @Value("${app.admin.password:}")
  private String defaultAdminPassword;

  @Bean
  public CommandLineRunner initializeData(UserRepository userRepository, PasswordEncoder passwordEncoder) {
    return args -> {
      try {
        if (defaultAdminEmail == null || defaultAdminEmail.isBlank() ||
            defaultAdminPassword == null || defaultAdminPassword.isBlank()) {
          System.out.println("\nℹ️ Admin seed skipped (APP_ADMIN_EMAIL / APP_ADMIN_PASSWORD not set).\n");
          return;
        }

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
          System.out.println("   Super Admin Email: " + defaultAdminEmail + "\n");
        }
      } catch (Exception e) {
        e.printStackTrace();
      }
    };
  }
}
