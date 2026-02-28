package com.photfolio.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MailConfigHealthCheck {

  @Bean
  public CommandLineRunner mailHealthCheckRunner(
      @Value("${spring.mail.username:}") String mailUsername,
      @Value("${MAIL_APP_PASSWORD:}") String mailAppPassword,
      @Value("${app.admin.email:}") String adminEmail
  ) {
    return args -> {
      boolean hasUsername = mailUsername != null && !mailUsername.trim().isEmpty();
      boolean hasAppPassword = mailAppPassword != null && !mailAppPassword.trim().isEmpty();
      boolean hasAdminEmail = adminEmail != null && !adminEmail.trim().isEmpty();

      if (hasUsername && hasAppPassword && hasAdminEmail) {
        System.out.println("✅ Mail config check: OK (username, app password, admin recipient configured)");
      } else {
        System.out.println("⚠️ Mail config check: INCOMPLETE");
        if (!hasUsername) {
          System.out.println("   - Missing spring.mail.username");
        }
        if (!hasAppPassword) {
          System.out.println("   - Missing MAIL_APP_PASSWORD environment variable");
        }
        if (!hasAdminEmail) {
          System.out.println("   - Missing app.admin.email");
        }
      }
    };
  }
}
