package com.photfolio.backend.repository;

import com.photfolio.backend.model.OtpAudit;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OtpAuditRepository extends MongoRepository<OtpAudit, String> {
  List<OtpAudit> findTop50ByOrderByCreatedAtDesc();
}
