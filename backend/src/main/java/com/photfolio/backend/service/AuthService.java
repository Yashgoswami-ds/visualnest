package com.photfolio.backend.service;

import com.photfolio.backend.model.AdminAccessSettings;
import com.photfolio.backend.model.LoginRequest;
import com.photfolio.backend.model.LoginResponse;
import com.photfolio.backend.model.RegistrationPasswordSetupRequest;
import com.photfolio.backend.model.User;
import com.photfolio.backend.repository.AdminAccessSettingsRepository;
import com.photfolio.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AuthService {

  @Value("${app.frontendBaseUrl:http://localhost:5173}")
  private String frontendBaseUrl;

  @Autowired
  private PasswordEncoder passwordEncoder;

  @Autowired
  private JwtTokenProvider jwtTokenProvider;

  @Autowired
  private CustomUserDetailsService userDetailsService;

  @Autowired
  private EmailService emailService;

  @Autowired
  private OtpAuditService otpAuditService;

  @Autowired
  private UserRepository userRepository;

  @Autowired
  private AdminAccessSettingsRepository adminAccessSettingsRepository;

  @Autowired
  private OtpSessionStore otpSessionStore;

  private final SecureRandom secureRandom = new SecureRandom();

  private static final long OTP_TTL_SECONDS = 5 * 60;
  private static final long PASSWORD_RESET_LINK_TTL_MILLIS = 5 * 60 * 1000;
  private static final long REGISTRATION_PASSWORD_SETUP_TTL_SECONDS = 10 * 60;

  private static class PendingRegistration {
    private final String name;
    private final String otp;
    private final Instant expiresAt;
    private final String auditId;

    PendingRegistration(String name, String otp, Instant expiresAt, String auditId) {
      this.name = name;
      this.otp = otp;
      this.expiresAt = expiresAt;
      this.auditId = auditId;
    }
  }

  private static class PendingPasswordSetup {
    private final String name;
    private final Instant expiresAt;

    PendingPasswordSetup(String name, Instant expiresAt) {
      this.name = name;
      this.expiresAt = expiresAt;
    }
  }

  private static class PendingLogin {
    private final String otp;
    private final Instant expiresAt;
    private final String auditId;

    PendingLogin(String otp, Instant expiresAt, String auditId) {
      this.otp = otp;
      this.expiresAt = expiresAt;
      this.auditId = auditId;
    }
  }

  private static class PendingPasswordReset {
    private final String otp;
    private final Instant expiresAt;
    private final String auditId;

    PendingPasswordReset(String otp, Instant expiresAt, String auditId) {
      this.otp = otp;
      this.expiresAt = expiresAt;
      this.auditId = auditId;
    }
  }

  private String generateOtp() {
    return String.format("%06d", secureRandom.nextInt(1_000_000));
  }

  private String normalizeEmail(String email) {
    return email == null ? "" : email.trim().toLowerCase();
  }

  private String otpKey(String type, String email) {
    return "visualnest:otp:" + type + ":" + email;
  }

  private void saveRegistration(String email, PendingRegistration pending) {
    otpSessionStore.put(otpKey("registration", email), Map.of(
        "name", pending.name,
        "otp", pending.otp,
        "expiresAt", pending.expiresAt.toString(),
        "auditId", pending.auditId
    ), Duration.ofSeconds(OTP_TTL_SECONDS));
  }

  private PendingRegistration getRegistration(String email) {
    Map<String, String> values = otpSessionStore.get(otpKey("registration", email));
    return values.isEmpty() ? null : new PendingRegistration(
        values.get("name"), values.get("otp"), Instant.parse(values.get("expiresAt")), values.get("auditId")
    );
  }

  private void savePasswordSetup(String email, PendingPasswordSetup pending) {
    otpSessionStore.put(otpKey("password-setup", email), Map.of(
        "name", pending.name,
        "expiresAt", pending.expiresAt.toString()
    ), Duration.ofSeconds(REGISTRATION_PASSWORD_SETUP_TTL_SECONDS));
  }

  private PendingPasswordSetup getPasswordSetup(String email) {
    Map<String, String> values = otpSessionStore.get(otpKey("password-setup", email));
    return values.isEmpty() ? null : new PendingPasswordSetup(
        values.get("name"), Instant.parse(values.get("expiresAt"))
    );
  }

  private void saveLogin(String email, PendingLogin pending) {
    otpSessionStore.put(otpKey("login", email), Map.of(
        "otp", pending.otp,
        "expiresAt", pending.expiresAt.toString(),
        "auditId", pending.auditId
    ), Duration.ofSeconds(OTP_TTL_SECONDS));
  }

  private PendingLogin getLogin(String email) {
    Map<String, String> values = otpSessionStore.get(otpKey("login", email));
    return values.isEmpty() ? null : new PendingLogin(
        values.get("otp"), Instant.parse(values.get("expiresAt")), values.get("auditId")
    );
  }

  private void savePasswordReset(String email, PendingPasswordReset pending) {
    otpSessionStore.put(otpKey("password-reset", email), Map.of(
        "otp", pending.otp,
        "expiresAt", pending.expiresAt.toString(),
        "auditId", pending.auditId
    ), Duration.ofSeconds(OTP_TTL_SECONDS));
  }

  private PendingPasswordReset getPasswordReset(String email) {
    Map<String, String> values = otpSessionStore.get(otpKey("password-reset", email));
    return values.isEmpty() ? null : new PendingPasswordReset(
        values.get("otp"), Instant.parse(values.get("expiresAt")), values.get("auditId")
    );
  }

  private AdminAccessSettings getOrCreateAccessSettings() {
    return adminAccessSettingsRepository.findById("global")
        .orElseGet(() -> {
          AdminAccessSettings settings = new AdminAccessSettings();
          settings.setId("global");
          settings.setMaxApprovedAdmins(3);
          return adminAccessSettingsRepository.save(settings);
        });
  }

  private User getUserOrThrow(String email) {
    String normalizedEmail = normalizeEmail(email);
    return userRepository.findByEmail(normalizedEmail)
        .orElseThrow(() -> new RuntimeException("User not found"));
  }

  private void normalizeLegacyUser(User user) {
    boolean changed = false;

    if (user.getRole() == null || user.getRole().isBlank()) {
      user.setRole(User.ROLE_ADMIN);
      changed = true;
    }

    if (user.getApprovalStatus() == null || user.getApprovalStatus().isBlank()) {
      if (user.isSuperAdmin()) {
        user.setApprovalStatus(User.APPROVAL_APPROVED);
        if (user.getApprovedAt() == null) {
          user.setApprovedAt(Instant.now());
        }
      } else {
        user.setApprovalStatus(User.APPROVAL_PENDING);
        if (user.getRequestedAt() == null) {
          user.setRequestedAt(Instant.now());
        }
      }
      changed = true;
    }

    if (changed) {
      userRepository.save(user);
    }
  }

  private void ensureSuperAdmin(String requesterEmail) {
    User requester = getUserOrThrow(requesterEmail);
    normalizeLegacyUser(requester);
    if (!requester.isSuperAdmin()) {
      throw new RuntimeException("Only super admin can perform this action");
    }
  }

  public LoginResponse login(LoginRequest request) {
    String email = normalizeEmail(request.getEmail());
    if (request.getPassword() == null || request.getPassword().trim().isEmpty()) {
      throw new RuntimeException("Password is required");
    }
    try {
      UserDetails userDetails = userDetailsService.loadUserByUsername(email);
      boolean passwordMatches = passwordEncoder.matches(request.getPassword(), userDetails.getPassword());
      if (!passwordMatches) {
        throw new RuntimeException("Invalid email or password");
      }

      User user = getUserOrThrow(email);
      normalizeLegacyUser(user);

      if (!user.isApproved()) {
        if (User.APPROVAL_PENDING.equalsIgnoreCase(user.getApprovalStatus())) {
          throw new RuntimeException("Access request is pending approval from super admin");
        }
        throw new RuntimeException("Access is not approved for this account");
      }

      if (!user.isEnabled()) {
        throw new RuntimeException("Account is disabled. Contact super admin");
      }

      user.setSessionVersion(user.getSessionVersion() + 1);
      userRepository.save(user);

      String token = jwtTokenProvider.generateToken(email, user.getSessionVersion());
      return new LoginResponse(token, "Login successful");
    } catch (UsernameNotFoundException e) {
      throw new RuntimeException("Invalid email or password");
    }
  }

  public boolean isEmailRegistered(String email) {
    String normalizedEmail = normalizeEmail(email);
    if (normalizedEmail.isBlank()) {
      throw new RuntimeException("Email is required");
    }
    return userDetailsService.userExists(normalizedEmail);
  }

  public LoginResponse verifyLoginOtp(String email, String otp) {
    String normalizedEmail = normalizeEmail(email);
    PendingLogin pendingLogin = getLogin(normalizedEmail);

    if (pendingLogin == null) {
      throw new RuntimeException("OTP session not found. Please login again.");
    }

    if (Instant.now().isAfter(pendingLogin.expiresAt)) {
      otpSessionStore.delete(otpKey("login", normalizedEmail));
      otpAuditService.markExpired(pendingLogin.auditId);
      throw new RuntimeException("OTP expired. Please login again.");
    }

    if (!pendingLogin.otp.equals(otp)) {
      otpAuditService.markAttempt(pendingLogin.auditId);
      throw new RuntimeException("Invalid OTP");
    }

    otpSessionStore.delete(otpKey("login", normalizedEmail));
    otpAuditService.markVerified(pendingLogin.auditId);

    User user = getUserOrThrow(normalizedEmail);
    normalizeLegacyUser(user);
    if (!user.isApproved()) {
      throw new RuntimeException("Access is not approved for this account");
    }

    user.setSessionVersion(user.getSessionVersion() + 1);
    userRepository.save(user);

    String token = jwtTokenProvider.generateToken(normalizedEmail, user.getSessionVersion());
    return new LoginResponse(token, "Login successful");
  }

  public void register(LoginRequest request) {
    sendRegistrationOtp(request.getName(), request.getEmail());
  }

  public void sendRegistrationOtp(LoginRequest request) {
    sendRegistrationOtp(request.getName(), request.getEmail());
  }

  public void sendRegistrationOtp(String nameInput, String emailInput) {
    String name = nameInput == null ? "" : nameInput.trim();
    String email = normalizeEmail(emailInput);

    if (name.isBlank()) {
      throw new RuntimeException("Name is required");
    }

    if (email.isBlank()) {
      throw new RuntimeException("Email is required");
    }

    User existingUser = userRepository.findByEmail(email).orElse(null);
    if (existingUser != null) {
      throw new RuntimeException("Account already exists in database. Use existing user access request.");
    }

    String otp = generateOtp();
    Instant expiresAt = Instant.now().plusSeconds(OTP_TTL_SECONDS);
    String auditId = otpAuditService.createOtpRecord(email, "registration", expiresAt);

    saveRegistration(email, new PendingRegistration(name, otp, expiresAt, auditId));

    emailService.sendRegistrationOtpEmail(email, otp);
  }

  public void verifyRegistrationOtp(String email, String otp) {
    String normalizedEmail = normalizeEmail(email);
    PendingRegistration pendingRegistration = getRegistration(normalizedEmail);

    if (pendingRegistration == null) {
      throw new RuntimeException("OTP session not found. Please request a new OTP.");
    }

    if (Instant.now().isAfter(pendingRegistration.expiresAt)) {
      otpSessionStore.delete(otpKey("registration", normalizedEmail));
      otpAuditService.markExpired(pendingRegistration.auditId);
      throw new RuntimeException("OTP expired. Please request a new OTP.");
    }

    if (!pendingRegistration.otp.equals(otp)) {
      otpAuditService.markAttempt(pendingRegistration.auditId);
      throw new RuntimeException("Invalid OTP");
    }

    User user = userRepository.findByEmail(normalizedEmail).orElse(null);

    if (user != null) {
      throw new RuntimeException("Account already exists in database. Use existing user access request.");
    }

    savePasswordSetup(normalizedEmail, new PendingPasswordSetup(
      pendingRegistration.name,
      Instant.now().plusSeconds(REGISTRATION_PASSWORD_SETUP_TTL_SECONDS)
    ));

    otpSessionStore.delete(otpKey("registration", normalizedEmail));
    otpAuditService.markVerified(pendingRegistration.auditId);
  }

  public void setRegistrationPassword(RegistrationPasswordSetupRequest request) {
    String normalizedEmail = normalizeEmail(request.getEmail());
    String password = request.getPassword();

    if (normalizedEmail.isBlank()) {
      throw new RuntimeException("Email is required");
    }

    if (password == null || password.trim().length() < 6) {
      throw new RuntimeException("Password must be at least 6 characters");
    }

    PendingPasswordSetup pendingPasswordSetup = getPasswordSetup(normalizedEmail);
    if (pendingPasswordSetup == null) {
      throw new RuntimeException("Password setup session not found. Verify OTP again.");
    }

    if (Instant.now().isAfter(pendingPasswordSetup.expiresAt)) {
      otpSessionStore.delete(otpKey("password-setup", normalizedEmail));
      throw new RuntimeException("Password setup session expired. Verify OTP again.");
    }

    User existingUser = userRepository.findByEmail(normalizedEmail).orElse(null);
    if (existingUser != null) {
      throw new RuntimeException("Account already exists in database. Use existing user access request.");
    }

    User newUser = new User(
        normalizedEmail,
        passwordEncoder.encode(password.trim()),
        User.ROLE_ADMIN,
        User.APPROVAL_REJECTED
    );
    newUser.setName(pendingPasswordSetup.name);
    newUser.setEnabled(true);
    userRepository.save(newUser);

    otpSessionStore.delete(otpKey("password-setup", normalizedEmail));
  }

  public void requestAdminAccess(LoginRequest request) {
    String name = request.getName() == null ? "" : request.getName().trim();
    String email = normalizeEmail(request.getEmail());

    if (name.isBlank()) {
      throw new RuntimeException("Name is required");
    }

    if (email.isBlank()) {
      throw new RuntimeException("Email is required");
    }

    User user = userRepository.findByEmail(email).orElse(null);

    if (user == null) {
      throw new RuntimeException("Please verify your email first using OTP, then request admin access.");
    }

    normalizeLegacyUser(user);
    if (user.isApproved()) {
      throw new RuntimeException("This account is already approved. Please login.");
    }

    if (User.APPROVAL_PENDING.equalsIgnoreCase(user.getApprovalStatus())) {
      throw new RuntimeException("Access request already submitted. Please wait for approval.");
    }

    user.setName(name);
    user.setApprovalStatus(User.APPROVAL_PENDING);
    user.setRequestedAt(Instant.now());
    user.setEnabled(true);
    userRepository.save(user);

    emailService.sendAdminAccessRequestEmail(email);
    emailService.sendAccessRequestReceivedEmail(email);
  }

  public void requestAdminAccessForExistingUser(LoginRequest request) {
    String email = normalizeEmail(request.getEmail());
    String password = request.getPassword();

    if (email.isBlank()) {
      throw new RuntimeException("Email is required");
    }

    if (password == null || password.trim().isEmpty()) {
      throw new RuntimeException("Password is required");
    }

    User user = userRepository.findByEmail(email).orElse(null);
    if (user == null) {
      throw new RuntimeException("Account not found in database. Please use new user OTP registration first.");
    }

    normalizeLegacyUser(user);

    if (!passwordEncoder.matches(password, user.getPassword())) {
      throw new RuntimeException("Invalid email or password");
    }

    if (user.isApproved()) {
      throw new RuntimeException("This account is already approved. Please login.");
    }

    if (User.APPROVAL_PENDING.equalsIgnoreCase(user.getApprovalStatus())) {
      throw new RuntimeException("Access request already submitted. Please wait for approval.");
    }

    user.setApprovalStatus(User.APPROVAL_PENDING);
    user.setRequestedAt(Instant.now());
    user.setEnabled(true);
    userRepository.save(user);

    emailService.sendAdminAccessRequestEmail(email);
    emailService.sendAccessRequestReceivedEmail(email);
  }

  public List<Map<String, Object>> getPendingAccessRequests(String requesterEmail) {
    ensureSuperAdmin(requesterEmail);
    return userRepository.findByApprovalStatusIgnoreCase(User.APPROVAL_PENDING).stream()
        .map(user -> {
          Map<String, Object> item = new HashMap<>();
          item.put("name", user.getName());
          item.put("email", user.getEmail());
          item.put("requestedAt", user.getRequestedAt());
          item.put("status", user.getApprovalStatus());
          return item;
        })
        .collect(Collectors.toList());
  }

  public List<Map<String, Object>> getApprovedAccessUsers(String requesterEmail) {
    ensureSuperAdmin(requesterEmail);
    return userRepository.findByApprovalStatusIgnoreCase(User.APPROVAL_APPROVED).stream()
        .map(user -> {
          Map<String, Object> item = new HashMap<>();
          item.put("name", user.getName());
          item.put("email", user.getEmail());
          item.put("approvedAt", user.getApprovedAt());
          item.put("role", user.getRole());
          return item;
        })
        .collect(Collectors.toList());
  }

  public Map<String, Object> getAccessPolicy(String requesterEmail) {
    ensureSuperAdmin(requesterEmail);
    AdminAccessSettings settings = getOrCreateAccessSettings();
    long approvedCount = userRepository.countByApprovalStatusIgnoreCase(User.APPROVAL_APPROVED);
    long pendingCount = userRepository.countByApprovalStatusIgnoreCase(User.APPROVAL_PENDING);

    Map<String, Object> response = new HashMap<>();
    response.put("maxApprovedAdmins", settings.getMaxApprovedAdmins());
    response.put("approvedCount", approvedCount);
    response.put("pendingCount", pendingCount);
    return response;
  }

  public Map<String, Object> updateAccessPolicy(String requesterEmail, int maxApprovedAdmins) {
    ensureSuperAdmin(requesterEmail);

    if (maxApprovedAdmins < 1) {
      throw new RuntimeException("Max approved admins must be at least 1");
    }

    AdminAccessSettings settings = getOrCreateAccessSettings();
    settings.setMaxApprovedAdmins(maxApprovedAdmins);
    adminAccessSettingsRepository.save(settings);

    return getAccessPolicy(requesterEmail);
  }

  public void approveAccessRequest(String requesterEmail, String targetEmail) {
    ensureSuperAdmin(requesterEmail);
    User target = getUserOrThrow(targetEmail);
    normalizeLegacyUser(target);

    if (target.isApproved()) {
      return;
    }

    AdminAccessSettings settings = getOrCreateAccessSettings();
    long approvedCount = userRepository.countByApprovalStatusIgnoreCase(User.APPROVAL_APPROVED);
    if (approvedCount >= settings.getMaxApprovedAdmins()) {
      throw new RuntimeException("Approved admin limit reached. Increase limit before approving.");
    }

    target.setApprovalStatus(User.APPROVAL_APPROVED);
    target.setApprovedAt(Instant.now());
    target.setEnabled(true);
    target.setRole(User.ROLE_ADMIN);
    target.setSessionVersion(target.getSessionVersion() + 1);
    userRepository.save(target);

    emailService.sendAccessApprovedEmail(target.getEmail());
  }

  public void rejectAccessRequest(String requesterEmail, String targetEmail) {
    ensureSuperAdmin(requesterEmail);
    User target = getUserOrThrow(targetEmail);
    normalizeLegacyUser(target);

    target.setApprovalStatus(User.APPROVAL_REJECTED);
    target.setEnabled(false);
    target.setSessionVersion(target.getSessionVersion() + 1);
    userRepository.save(target);

    emailService.sendAccessRejectedEmail(target.getEmail());
  }

  public void revokeAccess(String requesterEmail, String targetEmail) {
    ensureSuperAdmin(requesterEmail);
    User target = getUserOrThrow(targetEmail);
    normalizeLegacyUser(target);

    if (target.isSuperAdmin()) {
      throw new RuntimeException("Super admin access cannot be revoked");
    }

    target.setApprovalStatus(User.APPROVAL_REJECTED);
    target.setEnabled(false);
    target.setSessionVersion(target.getSessionVersion() + 1);
    userRepository.save(target);
  }

  public Map<String, Object> getCurrentAdminProfile(String requesterEmail) {
    User user = getUserOrThrow(requesterEmail);
    normalizeLegacyUser(user);

    Map<String, Object> response = new HashMap<>();
    response.put("name", user.getName());
    response.put("email", user.getEmail());
    response.put("role", user.getRole());
    response.put("approved", user.isApproved());
    return response;
  }

  public void forgotPassword(String email) {
    String normalizedEmail = normalizeEmail(email);
    if (!userDetailsService.userExists(normalizedEmail)) {
      throw new RuntimeException("Email not found");
    }
    User user = getUserOrThrow(normalizedEmail);
    String token = jwtTokenProvider.generateToken(normalizedEmail, user.getSessionVersion(), PASSWORD_RESET_LINK_TTL_MILLIS);
    String normalizedFrontendBase = frontendBaseUrl == null ? "" : frontendBaseUrl.trim();
    if (normalizedFrontendBase.endsWith("/")) {
      normalizedFrontendBase = normalizedFrontendBase.substring(0, normalizedFrontendBase.length() - 1);
    }
    String resetLink = normalizedFrontendBase + "/reset-password?token=" + token;
    emailService.sendPasswordResetEmail(normalizedEmail, resetLink);
  }

  public void sendPasswordResetOtp(String email) {
    String normalizedEmail = normalizeEmail(email);
    if (!userDetailsService.userExists(normalizedEmail)) {
      throw new RuntimeException("Email not found");
    }

    String otp = generateOtp();
    Instant expiresAt = Instant.now().plusSeconds(OTP_TTL_SECONDS);
    String auditId = otpAuditService.createOtpRecord(normalizedEmail, "password-reset", expiresAt);

    savePasswordReset(normalizedEmail, new PendingPasswordReset(otp, expiresAt, auditId));
    emailService.sendPasswordResetOtpEmail(normalizedEmail, otp);
  }

  public void resetPasswordWithOtp(String email, String otp, String newPassword) {
    String normalizedEmail = normalizeEmail(email);
    PendingPasswordReset pendingPasswordReset = getPasswordReset(normalizedEmail);

    if (pendingPasswordReset == null) {
      throw new RuntimeException("OTP session not found. Please request a new OTP.");
    }

    if (Instant.now().isAfter(pendingPasswordReset.expiresAt)) {
      otpSessionStore.delete(otpKey("password-reset", normalizedEmail));
      otpAuditService.markExpired(pendingPasswordReset.auditId);
      throw new RuntimeException("OTP expired. Please request a new OTP.");
    }

    if (!pendingPasswordReset.otp.equals(otp)) {
      otpAuditService.markAttempt(pendingPasswordReset.auditId);
      throw new RuntimeException("Invalid OTP");
    }

    String encodedPassword = passwordEncoder.encode(newPassword);
    User user = getUserOrThrow(normalizedEmail);
    user.setPassword(encodedPassword);
    user.setSessionVersion(user.getSessionVersion() + 1);
    userRepository.save(user);
    otpSessionStore.delete(otpKey("password-reset", normalizedEmail));
    otpAuditService.markVerified(pendingPasswordReset.auditId);
  }

  public void resetPasswordWithToken(String token, String newPassword) {
    try {
      String email = jwtTokenProvider.getEmailFromToken(token);
      if (!jwtTokenProvider.validateToken(token)) {
        throw new RuntimeException("Invalid or expired token");
      }
      String encodedPassword = passwordEncoder.encode(newPassword);
      User user = getUserOrThrow(email);
      user.setPassword(encodedPassword);
      user.setSessionVersion(user.getSessionVersion() + 1);
      userRepository.save(user);
    } catch (Exception e) {
      throw new RuntimeException("Invalid token");
    }
  }

  public boolean validateUser(String email, String password) {
    try {
      UserDetails userDetails = userDetailsService.loadUserByUsername(email);
      return passwordEncoder.matches(password, userDetails.getPassword());
    } catch (UsernameNotFoundException e) {
      return false;
    }
  }
}
