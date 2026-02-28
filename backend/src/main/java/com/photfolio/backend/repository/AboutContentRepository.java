package com.photfolio.backend.repository;

import com.photfolio.backend.model.AboutContent;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface AboutContentRepository extends MongoRepository<AboutContent, String> {
}
