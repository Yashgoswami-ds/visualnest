package com.photfolio.backend.service;

import com.photfolio.backend.model.OtpAudit;
import com.photfolio.backend.repository.OtpAuditRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
public class OtpAuditService {

  @Autowired
  private OtpAuditRepository otpAuditRepository;

  public String createOtpRecord(String email, String purpose, Instant expiresAt) {
    OtpAudit otpAudit = new OtpAudit();
    otpAudit.setEmail(email);
    otpAudit.setPurpose(purpose);
    otpAudit.setStatus("sent");
    otpAudit.setExpiresAt(expiresAt);
    otpAudit.setCreatedAt(Instant.now());
    otpAudit.setUpdatedAt(Instant.now());
    otpAudit.setAttempts(0);
    return otpAuditRepository.save(otpAudit).getId();
  }

  public void markAttempt(String id) {
    Optional<OtpAudit> optional = otpAuditRepository.findById(id);
    if (optional.isEmpty()) {
      return;
    }

    OtpAudit otpAudit = optional.get();
    otpAudit.setAttempts(otpAudit.getAttempts() + 1);
    otpAudit.setLastAttemptAt(Instant.now());
    otpAudit.setUpdatedAt(Instant.now());
    otpAudit.setStatus("attempted");
    otpAuditRepository.save(otpAudit);
  }

  public void markVerified(String id) {
    Optional<OtpAudit> optional = otpAuditRepository.findById(id);
    if (optional.isEmpty()) {
      return;
    }

    OtpAudit otpAudit = optional.get();
    otpAudit.setStatus("verified");
    otpAudit.setVerifiedAt(Instant.now());
    otpAudit.setUpdatedAt(Instant.now());
    otpAuditRepository.save(otpAudit);
  }

  public void markExpired(String id) {
    Optional<OtpAudit> optional = otpAuditRepository.findById(id);
    if (optional.isEmpty()) {
      return;
    }

    OtpAudit otpAudit = optional.get();
    otpAudit.setStatus("expired");
    otpAudit.setUpdatedAt(Instant.now());
    otpAuditRepository.save(otpAudit);
  }

  public List<OtpAudit> getRecentRecords() {
    return otpAuditRepository.findTop50ByOrderByCreatedAtDesc();
  }
}
