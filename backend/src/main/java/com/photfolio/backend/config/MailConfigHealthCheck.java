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
      @Value("${spring.mail.password:}") String mailPassword,
      @Value("${app.admin.email:}") String adminEmail
  ) {
    return args -> {
      boolean hasUsername = mailUsername != null && !mailUsername.trim().isEmpty();
      boolean hasPassword = mailPassword != null && !mailPassword.trim().isEmpty();
      boolean hasAdminEmail = adminEmail != null && !adminEmail.trim().isEmpty();

      if (hasUsername && hasPassword) {
        System.out.println("✅ Mail config check: OK (SMTP username/password configured)");
        if (!hasAdminEmail) {
          System.out.println("⚠️ Mail note: app.admin.email not set (admin approval mails will go to sender address)");
        }
      } else {
        System.out.println("⚠️ Mail config check: INCOMPLETE");
        if (!hasUsername) {
          System.out.println("   - Missing spring.mail.username");
        }
        if (!hasPassword) {
          System.out.println("   - Missing spring.mail.password");
        }
      }
    };
  }
}
