package com.photfolio.backend.repository;

import com.photfolio.backend.model.ImageDto;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ImageRepository extends MongoRepository<ImageDto, String> {
  List<ImageDto> findByCategory(String category);
  List<ImageDto> findByMediaKind(String mediaKind);
  List<ImageDto> findBySection(String section);
  List<ImageDto> findBySectionAndMediaKind(String section, String mediaKind);
  ImageDto findFirstByCategoryOrderByUpdatedAtDesc(String category);
}
