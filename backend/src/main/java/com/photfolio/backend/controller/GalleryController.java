package com.photfolio.backend.controller;

import com.photfolio.backend.model.ImageDto;
import com.photfolio.backend.service.GalleryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/gallery")
public class GalleryController {

  @Autowired
  private GalleryService galleryService;

  @GetMapping
  public ResponseEntity<List<ImageDto>> getAllImages() {
    return ResponseEntity.ok(galleryService.getAllImages());
  }

  @GetMapping("/images")
  public ResponseEntity<List<ImageDto>> getOnlyImages() {
    return ResponseEntity.ok(galleryService.getOnlyImages());
  }

  @GetMapping("/videos")
  public ResponseEntity<List<ImageDto>> getOnlyVideos() {
    return ResponseEntity.ok(galleryService.getOnlyVideos());
  }

  @GetMapping("/{category}")
  public ResponseEntity<List<ImageDto>> getImagesByCategory(@PathVariable("category") String category) {
    return ResponseEntity.ok(galleryService.getImagesByCategory(category));
  }

  @GetMapping("/collections/{section}")
  public ResponseEntity<List<ImageDto>> getByCollection(@PathVariable("section") String section) {
    return ResponseEntity.ok(galleryService.getByCollection(section));
  }

  @GetMapping("/collections/{section}/{mediaKind}")
  public ResponseEntity<List<ImageDto>> getByCollectionAndMediaKind(
      @PathVariable("section") String section,
      @PathVariable("mediaKind") String mediaKind) {
    return ResponseEntity.ok(galleryService.getByCollectionAndMediaKind(section, mediaKind));
  }

  @PostMapping
  public ResponseEntity<ImageDto> addImage(@RequestBody ImageDto imageDto) {
    return ResponseEntity.ok(galleryService.addImage(imageDto));
  }

  @PostMapping("/upload")
  public ResponseEntity<ImageDto> uploadImage(
      @RequestParam("file") MultipartFile file,
      @RequestParam(value = "title", required = false) String title,
      @RequestParam(value = "category", required = false) String category) {
    return ResponseEntity.ok(galleryService.uploadImage(file, title, category));
  }

  @PutMapping("/{id}")
  public ResponseEntity<ImageDto> updateImage(@PathVariable("id") String id, @RequestBody ImageDto imageDto) {
    return ResponseEntity.ok(galleryService.updateImage(id, imageDto));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<String> deleteImage(@PathVariable("id") String id) {
    galleryService.deleteImage(id);
    return ResponseEntity.ok("Image deleted successfully");
  }
}
