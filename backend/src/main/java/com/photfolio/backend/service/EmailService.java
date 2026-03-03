package com.photfolio.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Objects;

@Service
public class EmailService {

  @Autowired(required = false)
  private JavaMailSender mailSender;

  @Value("${spring.mail.username:}")
  private String fromEmail;

  @Value("${app.admin.email:}")
  private String adminEmail;

  private List<String> resolveAdminRecipients() {
    LinkedHashSet<String> recipients = new LinkedHashSet<>();
    String safeAdminEmail = safe(adminEmail);
    String safeFromEmail = safe(fromEmail);

    if (!safeAdminEmail.isEmpty()) {
      recipients.add(safeAdminEmail);
    }
    if (!safeFromEmail.isEmpty()) {
      recipients.add(safeFromEmail);
    }

    return new ArrayList<>(recipients);
  }

  private String safe(String value) {
    return Objects.requireNonNullElse(value, "").trim();
  }

  private String escapeHtml(String value) {
    if (value == null) {
      return "";
    }
    return value
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace("\"", "&quot;")
        .replace("'", "&#39;");
  }

  private String escapeHtmlWithBreaks(String value) {
    return escapeHtml(value).replace("\n", "<br/>");
  }

  private String otpBlock(String otp) {
    return "<div style=\"margin:20px 0;padding:14px 18px;border:1px dashed #cbd5e1;border-radius:10px;text-align:center;background:#f8fafc;\">"
        + "<span style=\"font-size:32px;letter-spacing:8px;font-weight:700;color:#111827;\">"
        + escapeHtml(otp)
        + "</span>"
        + "</div>";
  }

  private String button(String url, String label) {
    return "<a href=\""
        + escapeHtml(url)
        + "\" style=\"display:inline-block;background:#1d4ed8;color:#ffffff !important;text-decoration:none;font-size:14px;font-weight:700;padding:11px 18px;border-radius:10px;\">"
      + escapeHtml(label)
        + "</a>";
  }

  private String buildEmailTemplate(String title, String intro, String bodyHtml, String footerNote) {
    return "<html>"
        + "<body style=\"margin:0;padding:0;background:#f4f6fb;font-family:Arial,sans-serif;color:#1f2937;\">"
        + "<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"padding:24px 12px;\">"
        + "<tr><td align=\"center\">"
        + "<table role=\"presentation\" width=\"620\" cellspacing=\"0\" cellpadding=\"0\" style=\"max-width:620px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e5e7eb;box-shadow:0 10px 26px rgba(0,0,0,0.08);\">"
        + "<tr><td style=\"background:linear-gradient(120deg,#0f172a 0%,#1d4ed8 55%,#4338ca 100%);padding:18px 22px;color:#ffffff;\">"
        + "<div style=\"font-size:22px;font-weight:800;letter-spacing:0.4px;\">Visualnest</div>"
        + "<div style=\"margin-top:6px;font-size:12px;opacity:0.9;\">"
        + escapeHtml(title)
        + "</div>"
        + "</td></tr>"
        + "<tr><td style=\"padding:22px 24px;\">"
        + "<p style=\"margin:0 0 12px;font-size:15px;line-height:1.7;color:#334155;\">"
        + escapeHtml(intro)
        + "</p>"
        + bodyHtml
        + "</td></tr>"
        + "<tr><td style=\"padding:12px 24px 22px;font-size:12px;color:#64748b;text-align:center;border-top:1px solid #e5e7eb;\">"
        + escapeHtml(footerNote)
        + "</td></tr>"
        + "</table>"
        + "</td></tr></table></body></html>";
  }

  private void sendHtmlEmail(
      List<String> recipients,
      String subject,
      String title,
      String intro,
      String bodyHtml,
      String footerNote,
      String replyTo
  ) throws Exception {
    if (mailSender == null) {
      throw new RuntimeException("Email service is not configured on server");
    }

    String safeFromEmail = safe(fromEmail);
    if (safeFromEmail.isEmpty()) {
      throw new RuntimeException("Sender email is not configured (spring.mail.username)");
    }

    List<String> normalizedRecipients = recipients.stream()
        .map(this::safe)
        .filter(v -> !v.isEmpty())
        .toList();

    if (normalizedRecipients.isEmpty()) {
      throw new RuntimeException("No recipient configured for email");
    }

    MimeMessage mimeMessage = mailSender.createMimeMessage();
    MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
    helper.setTo(normalizedRecipients.toArray(new String[0]));
    helper.setFrom(safeFromEmail);

    String safeReplyTo = safe(replyTo);
    if (!safeReplyTo.isEmpty()) {
      helper.setReplyTo(safeReplyTo);
    }

    helper.setSubject(subject);
    helper.setText(buildEmailTemplate(title, intro, bodyHtml, footerNote), true);
    mailSender.send(mimeMessage);
  }

  public void sendPasswordResetEmail(String email, String resetLink) {
    try {
      if (mailSender == null) {
        throw new RuntimeException("Email service is not configured on server");
      }

      String body = "<p style=\"margin:0 0 14px;font-size:14px;color:#475569;\">Use the button below to reset your password.</p>"
          + button(resetLink, "Reset Password")
          + "<p style=\"margin:16px 0 6px;font-size:13px;color:#64748b;\">If the button does not work, open this link manually:</p>"
          + "<p style=\"margin:0;font-size:12px;word-break:break-all;color:#1d4ed8;\">"
          + escapeHtml(resetLink)
          + "</p>"
          + "<p style=\"margin:16px 0 0;font-size:13px;color:#64748b;\">If you didn’t request this, you can ignore this email.</p>";

      sendHtmlEmail(
          List.of(email),
          "Visualnest - Password Reset Request",
          "Password Reset",
          "A password reset request was received for your account.",
          body,
          "Visualnest • Security Notification",
          null
      );
    } catch (Exception e) {
      String reason = safe(e.getMessage());
      if (reason.isEmpty()) {
        reason = e.getClass().getSimpleName();
      }
      throw new RuntimeException("Failed to send password reset email: " + reason);
    }
  }

  public void sendPasswordResetOtpEmail(String email, String otp) {
    try {
      if (mailSender == null) {
        throw new RuntimeException("Email service is not configured on server");
      }

      String body = "<p style=\"margin:0 0 10px;font-size:14px;color:#334155;\">Use this 6-digit OTP to reset your password:</p>"
          + otpBlock(otp)
          + "<p style=\"margin:0;font-size:13px;color:#64748b;\">This OTP expires in 5 minutes.</p>";

      sendHtmlEmail(
          List.of(email),
          "Visualnest Password Reset OTP",
          "Password Reset OTP",
          "Password reset verification is required.",
          body,
          "Visualnest • Security Notification",
          null
      );
    } catch (Exception e) {
      String reason = safe(e.getMessage());
      if (reason.isEmpty()) {
        reason = e.getClass().getSimpleName();
      }
      throw new RuntimeException("Failed to send password reset OTP email: " + reason);
    }
  }

  public void sendWelcomeEmail(String email) {
    try {
      if (mailSender == null) {
        System.out.println("Email service not configured. Welcome email for: " + email);
        return;
      }

      String body = "<p style=\"margin:0 0 10px;font-size:14px;color:#334155;\">Welcome to Visualnest! Your account has been created successfully.</p>"
          + "<p style=\"margin:0 0 10px;font-size:14px;color:#334155;\">You can now log in securely and start managing your gallery.</p>"
          + "<p style=\"margin:0;font-size:13px;color:#64748b;\">If you did not create this account, please contact support immediately.</p>";

      sendHtmlEmail(
          List.of(email),
          "Welcome to Visualnest — Your Account Is Ready",
          "Welcome",
          "Your account is now ready.",
          body,
          "Team Visualnest",
          null
      );
    } catch (Exception e) {
      System.out.println("Failed to send email: " + e.getMessage());
    }
  }

  public void sendRegistrationOtpEmail(String email, String otp) {
    try {
      if (mailSender == null) {
        throw new RuntimeException("Email service is not configured on server");
      }

      String body = "<p style=\"margin:0 0 10px;font-size:14px;color:#334155;\">Use the following 6-digit OTP to verify your account registration:</p>"
          + otpBlock(otp)
          + "<p style=\"margin:0 0 8px;font-size:13px;color:#64748b;\">This OTP expires in 5 minutes.</p>"
          + "<p style=\"margin:0;font-size:13px;color:#64748b;\">If you did not request this, you can safely ignore this email.</p>";

      sendHtmlEmail(
          List.of(email),
          "Visualnest Verification Code (OTP)",
          "Registration Verification",
          "One last step to complete your registration.",
          body,
          "Visualnest • Verification",
          null
      );
    } catch (Exception e) {
      String reason = safe(e.getMessage());
      if (reason.isEmpty()) {
        reason = e.getClass().getSimpleName();
      }
      throw new RuntimeException("Failed to send OTP email: " + reason);
    }
  }

  public void sendLoginOtpEmail(String email, String otp) {
    try {
      if (mailSender == null) {
        throw new RuntimeException("Email service is not configured on server");
      }

      String body = "<p style=\"margin:0 0 10px;font-size:14px;color:#334155;\">Use this 6-digit OTP to complete your login:</p>"
          + otpBlock(otp)
          + "<p style=\"margin:0;font-size:13px;color:#64748b;\">This OTP expires in 5 minutes.</p>";

      sendHtmlEmail(
          List.of(email),
          "Visualnest Login OTP",
          "Login Verification",
          "Sign-in verification is required for your account.",
          body,
          "Visualnest • Security Notification",
          null
      );
    } catch (Exception e) {
      String reason = safe(e.getMessage());
      if (reason.isEmpty()) {
        reason = e.getClass().getSimpleName();
      }
      throw new RuntimeException("Failed to send login OTP email: " + reason);
    }
  }

  public void sendAdminAccessRequestEmail(String requesterEmail) {
    try {
      if (mailSender == null) {
        return;
      }

      List<String> recipients = resolveAdminRecipients();
      if (recipients.isEmpty()) {
        return;
      }

      String safeRequesterEmail = escapeHtml(requesterEmail);
      String body = "<p style=\"margin:0 0 10px;font-size:14px;color:#334155;\">A new admin access request has been submitted.</p>"
          + "<div style=\"margin:10px 0 0;padding:12px 14px;border:1px solid #e5e7eb;border-radius:10px;background:#f8fafc;font-size:14px;color:#0f172a;\">"
          + "<strong>Requester:</strong> " + safeRequesterEmail
          + "</div>"
          + "<p style=\"margin:14px 0 0;font-size:13px;color:#64748b;\">Please login to Admin Panel and approve or reject this request.</p>";

      sendHtmlEmail(
          recipients,
          "Visualnest Admin Access Request",
          "Admin Approval Required",
          "A pending admin access request needs your action.",
          body,
          "Visualnest • Admin Workflow",
          requesterEmail
      );
    } catch (Exception ignored) {
      // Non-blocking mail path
    }
  }

  public void sendAccessRequestReceivedEmail(String requesterEmail) {
    try {
      if (mailSender == null) {
        return;
      }

      String body = "<p style=\"margin:0 0 10px;font-size:14px;color:#334155;\">Your admin access request has been submitted successfully.</p>"
          + "<p style=\"margin:0;font-size:13px;color:#64748b;\">Please wait for super admin approval before logging in.</p>";

      sendHtmlEmail(
          List.of(requesterEmail),
          "Visualnest Access Request Received",
          "Request Received",
          "We have received your request.",
          body,
          "Visualnest • Admin Workflow",
          null
      );
    } catch (Exception ignored) {
      // Non-blocking mail path
    }
  }

  public void sendAccessApprovedEmail(String email) {
    try {
      if (mailSender == null) {
        return;
      }

      String body = "<p style=\"margin:0 0 10px;font-size:14px;color:#334155;\">Your admin access request has been approved.</p>"
          + "<p style=\"margin:0;font-size:13px;color:#64748b;\">You can now login to the admin panel.</p>";

      sendHtmlEmail(
          List.of(email),
          "Visualnest Access Approved",
          "Access Approved",
          "Great news — your access is now active.",
          body,
          "Visualnest • Admin Workflow",
          null
      );
    } catch (Exception ignored) {
      // Non-blocking mail path
    }
  }

  public void sendAccessRejectedEmail(String email) {
    try {
      if (mailSender == null) {
        return;
      }

      String body = "<p style=\"margin:0 0 10px;font-size:14px;color:#334155;\">Your admin access request has been rejected.</p>"
          + "<p style=\"margin:0;font-size:13px;color:#64748b;\">Please contact the super admin if you think this is a mistake.</p>";

      sendHtmlEmail(
          List.of(email),
          "Visualnest Access Request Update",
          "Access Request Update",
          "There is an update on your admin access request.",
          body,
          "Visualnest • Admin Workflow",
          null
      );
    } catch (Exception ignored) {
      // Non-blocking mail path
    }
  }

  public void sendContactQueryToAdmin(String name, String email, String userMessage) {
    try {
      if (mailSender == null) {
        throw new RuntimeException("Email service is not configured on server");
      }

      String safeReplyTo = safe(email);

      List<String> recipients = resolveAdminRecipients();
      if (recipients.isEmpty()) {
        throw new RuntimeException("No recipient configured for contact query email");
      }

      String safeName = escapeHtml(name);
      String safeEmail = escapeHtml(email);
      String safeMessage = escapeHtmlWithBreaks(userMessage);

      String body = "<p style=\"margin:0 0 14px;font-size:14px;color:#334155;\">A new client inquiry has been submitted from your contact page.</p>"
          + "<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"border-collapse:separate;border-spacing:0 10px;\">"
          + "<tr><td style=\"padding:12px 14px;border:1px solid #e5e7eb;border-radius:10px;background:#f8fafc;\"><span style=\"display:block;font-size:12px;color:#6b7280;margin-bottom:4px;\">Name</span><strong style=\"font-size:15px;color:#111827;\">"
          + safeName
          + "</strong></td></tr>"
          + "<tr><td style=\"padding:12px 14px;border:1px solid #e5e7eb;border-radius:10px;background:#f8fafc;\"><span style=\"display:block;font-size:12px;color:#6b7280;margin-bottom:4px;\">Email</span><strong style=\"font-size:15px;color:#111827;\">"
          + safeEmail
          + "</strong></td></tr>"
          + "</table>"
          + "<div style=\"margin-top:10px;padding:14px;border:1px solid #dbeafe;background:#eff6ff;border-radius:10px;\">"
          + "<div style=\"font-size:12px;color:#4b5563;margin-bottom:6px;\">Message</div>"
          + "<div style=\"font-size:14px;line-height:1.75;color:#1f2937;word-break:break-word;\">"
          + safeMessage
          + "</div></div>"
          + "<p style=\"margin:12px 0 0;font-size:12px;color:#64748b;\">Tip: You can reply directly to this email to respond quickly to the client.</p>";

      sendHtmlEmail(
          recipients,
          "New Contact Query from " + safe(name),
          "Contact Query",
          "A new message has arrived via your website contact form.",
          body,
          "Visualnest • Contact Notification",
          safeReplyTo
      );

      if (!safeReplyTo.isEmpty()) {
        sendContactQueryAcknowledgement(safeReplyTo, safe(name));
      }
    } catch (Exception e) {
      throw new RuntimeException("Failed to send contact query email: " + e.getMessage());
    }
  }

  private void sendContactQueryAcknowledgement(String userEmail, String userName) {
    try {
      String safeUserEmail = safe(userEmail);
      String safeUserName = safe(userName);
      if (safeUserEmail.isEmpty()) {
        return;
      }

      String intro = safeUserName.isEmpty()
          ? "Thanks for contacting us."
          : "Hi " + safeUserName + ", thanks for contacting us.";

      String body = "<p style=\"margin:0 0 10px;font-size:14px;color:#334155;\">Your query has been received successfully. Our team will get back to you shortly.</p>"
          + "<p style=\"margin:0;font-size:13px;color:#64748b;\">This is an automated acknowledgement from Visualnest.</p>";

      sendHtmlEmail(
          List.of(safeUserEmail),
          "Visualnest • We received your query",
          "Query Acknowledgement",
          intro,
          body,
          "Visualnest • Customer Support",
          null
      );
    } catch (Exception ignored) {
      // Acknowledgement failure should not break main contact workflow
    }
  }
}
