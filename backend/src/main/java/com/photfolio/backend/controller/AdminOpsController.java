package com.photfolio.backend.controller;

import com.photfolio.backend.model.OtpAudit;
import com.photfolio.backend.service.AuthService;
import com.photfolio.backend.service.OtpAuditService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminOpsController {

  @Autowired
  private OtpAuditService otpAuditService;

  @Autowired
  private AuthService authService;

  @GetMapping("/otp-audit")
  public ResponseEntity<List<OtpAudit>> getOtpAuditRecords() {
    return ResponseEntity.ok(otpAuditService.getRecentRecords());
  }

  @GetMapping("/access/pending")
  public ResponseEntity<List<Map<String, Object>>> getPendingAccessRequests(Authentication authentication) {
    return ResponseEntity.ok(authService.getPendingAccessRequests(authentication.getName()));
  }

  @GetMapping("/access/approved")
  public ResponseEntity<List<Map<String, Object>>> getApprovedAccessUsers(Authentication authentication) {
    return ResponseEntity.ok(authService.getApprovedAccessUsers(authentication.getName()));
  }

  @GetMapping("/access/policy")
  public ResponseEntity<Map<String, Object>> getAccessPolicy(Authentication authentication) {
    return ResponseEntity.ok(authService.getAccessPolicy(authentication.getName()));
  }

  @PutMapping("/access/policy")
  public ResponseEntity<Map<String, Object>> updateAccessPolicy(
      Authentication authentication,
      @RequestBody Map<String, Integer> request
  ) {
    Integer maxApprovedAdmins = request.get("maxApprovedAdmins");
    if (maxApprovedAdmins == null) {
      throw new RuntimeException("maxApprovedAdmins is required");
    }

    return ResponseEntity.ok(authService.updateAccessPolicy(authentication.getName(), maxApprovedAdmins));
  }

  @PostMapping("/access/approve/{email}")
  public ResponseEntity<Map<String, String>> approveAccessRequest(
      Authentication authentication,
      @PathVariable String email
  ) {
    authService.approveAccessRequest(authentication.getName(), email);
    return ResponseEntity.ok(Map.of("message", "Access approved"));
  }

  @DeleteMapping("/access/reject/{email}")
  public ResponseEntity<Map<String, String>> rejectAccessRequest(
      Authentication authentication,
      @PathVariable String email
  ) {
    authService.rejectAccessRequest(authentication.getName(), email);
    return ResponseEntity.ok(Map.of("message", "Access rejected"));
  }

  @PostMapping("/access/approve")
  public ResponseEntity<Map<String, String>> approveAccessRequestWithBody(
      Authentication authentication,
      @RequestBody Map<String, String> request
  ) {
    String email = request.get("email");
    if (email == null || email.trim().isEmpty()) {
      throw new RuntimeException("email is required");
    }
    authService.approveAccessRequest(authentication.getName(), email);
    return ResponseEntity.ok(Map.of("message", "Access approved"));
  }

  @PostMapping("/access/reject")
  public ResponseEntity<Map<String, String>> rejectAccessRequestWithBody(
      Authentication authentication,
      @RequestBody Map<String, String> request
  ) {
    String email = request.get("email");
    if (email == null || email.trim().isEmpty()) {
      throw new RuntimeException("email is required");
    }
    authService.rejectAccessRequest(authentication.getName(), email);
    return ResponseEntity.ok(Map.of("message", "Access rejected"));
  }

  @PostMapping("/access/revoke")
  public ResponseEntity<Map<String, String>> revokeAccess(
      Authentication authentication,
      @RequestBody Map<String, String> request
  ) {
    String email = request.get("email");
    if (email == null || email.trim().isEmpty()) {
      throw new RuntimeException("email is required");
    }
    authService.revokeAccess(authentication.getName(), email);
    return ResponseEntity.ok(Map.of("message", "Access revoked"));
  }
}
