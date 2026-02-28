package com.photfolio.backend.repository;

import com.photfolio.backend.model.ContactContent;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface ContactContentRepository extends MongoRepository<ContactContent, String> {
}
