package com.photfolio.backend.repository;

import com.photfolio.backend.model.AdminAccessSettings;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AdminAccessSettingsRepository extends MongoRepository<AdminAccessSettings, String> {
}
