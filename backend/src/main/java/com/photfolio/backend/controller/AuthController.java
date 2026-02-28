package com.photfolio.backend.controller;

import com.photfolio.backend.model.ForgotPasswordRequest;
import com.photfolio.backend.model.LoginRequest;
import com.photfolio.backend.model.LoginResponse;
import com.photfolio.backend.model.PasswordResetOtpRequest;
import com.photfolio.backend.model.RegistrationOtpRequest;
import com.photfolio.backend.model.RegistrationPasswordSetupRequest;
import com.photfolio.backend.model.RegistrationOtpVerifyRequest;
import com.photfolio.backend.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

  @Autowired
  private AuthService authService;

  @PostMapping("/login")
  public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
    return ResponseEntity.ok(authService.login(request));
  }

  @PostMapping("/verify-login-otp")
  public ResponseEntity<LoginResponse> verifyLoginOtp(@Valid @RequestBody RegistrationOtpVerifyRequest request) {
    return ResponseEntity.ok(authService.verifyLoginOtp(request.getEmail(), request.getOtp()));
  }

  @PostMapping("/register")
  public ResponseEntity<Map<String, String>> register(@Valid @RequestBody RegistrationOtpRequest request) {
    authService.sendRegistrationOtp(request.getName(), request.getEmail());
    Map<String, String> response = new HashMap<>();
    response.put("message", "Registration OTP sent. Verify OTP to create account in database.");
    return ResponseEntity.ok(response);
  }

  @PostMapping("/request-access")
  public ResponseEntity<Map<String, String>> requestAccess(@Valid @RequestBody LoginRequest request) {
    authService.requestAdminAccess(request);
    Map<String, String> response = new HashMap<>();
    response.put("message", "Access request submitted. Wait for super admin approval.");
    return ResponseEntity.ok(response);
  }

  @PostMapping("/request-access-existing")
  public ResponseEntity<Map<String, String>> requestAccessExisting(@Valid @RequestBody LoginRequest request) {
    authService.requestAdminAccessForExistingUser(request);
    Map<String, String> response = new HashMap<>();
    response.put("message", "Access request submitted. Wait for super admin approval.");
    return ResponseEntity.ok(response);
  }

  @PostMapping("/send-registration-otp")
  public ResponseEntity<Map<String, String>> sendRegistrationOtp(@Valid @RequestBody RegistrationOtpRequest request) {
    authService.sendRegistrationOtp(request.getName(), request.getEmail());
    Map<String, String> response = new HashMap<>();
    response.put("message", "Registration OTP sent. Verify OTP to create account in database.");
    return ResponseEntity.ok(response);
  }

  @PostMapping("/verify-registration-otp")
  public ResponseEntity<Map<String, String>> verifyRegistrationOtp(@Valid @RequestBody RegistrationOtpVerifyRequest request) {
    authService.verifyRegistrationOtp(request.getEmail(), request.getOtp());
    Map<String, String> response = new HashMap<>();
    response.put("message", "OTP verified. Set password to complete registration.");
    return ResponseEntity.ok(response);
  }

  @PostMapping("/set-registration-password")
  public ResponseEntity<Map<String, String>> setRegistrationPassword(
      @Valid @RequestBody RegistrationPasswordSetupRequest request
  ) {
    authService.setRegistrationPassword(request);
    Map<String, String> response = new HashMap<>();
    response.put("message", "Account setup complete. You can now request access.");
    return ResponseEntity.ok(response);
  }

  @PostMapping("/forgot-password")
  public ResponseEntity<Map<String, String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
    authService.forgotPassword(request.getEmail());
    Map<String, String> response = new HashMap<>();
    response.put("message", "Password reset link sent to email");
    return ResponseEntity.ok(response);
  }

  @PostMapping("/forgot-password-otp")
  public ResponseEntity<Map<String, String>> forgotPasswordOtp(@Valid @RequestBody ForgotPasswordRequest request) {
    authService.sendPasswordResetOtp(request.getEmail());
    Map<String, String> response = new HashMap<>();
    response.put("message", "Password reset OTP sent to email");
    return ResponseEntity.ok(response);
  }

  @PostMapping("/reset-password")
  public ResponseEntity<Map<String, String>> resetPassword(@RequestBody Map<String, String> request) {
    String token = request.get("token");
    String newPassword = request.get("newPassword");
    authService.resetPasswordWithToken(token, newPassword);
    Map<String, String> response = new HashMap<>();
    response.put("message", "Password reset successfully");
    return ResponseEntity.ok(response);
  }

  @PostMapping("/reset-password-otp")
  public ResponseEntity<Map<String, String>> resetPasswordWithOtp(@Valid @RequestBody PasswordResetOtpRequest request) {
    authService.resetPasswordWithOtp(request.getEmail(), request.getOtp(), request.getNewPassword());
    Map<String, String> response = new HashMap<>();
    response.put("message", "Password reset successfully");
    return ResponseEntity.ok(response);
  }

  @GetMapping("/validate")
  public ResponseEntity<Map<String, Boolean>> validateToken() {
    Map<String, Boolean> response = new HashMap<>();
    response.put("valid", true);
    return ResponseEntity.ok(response);
  }

  @GetMapping("/me")
  public ResponseEntity<Map<String, Object>> getCurrentAdminProfile(Authentication authentication) {
    return ResponseEntity.ok(authService.getCurrentAdminProfile(authentication.getName()));
  }
}
