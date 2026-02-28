package com.photfolio.backend.controller;

import com.photfolio.backend.model.AboutContent;
import com.photfolio.backend.service.AboutContentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/content/about")
public class AboutContentController {

  @Autowired
  private AboutContentService aboutContentService;

  @GetMapping
  public ResponseEntity<AboutContent> getAboutContent() {
    return ResponseEntity.ok(aboutContentService.getAboutContent());
  }

  @PutMapping
  public ResponseEntity<AboutContent> updateAboutContent(@RequestBody AboutContent request) {
    return ResponseEntity.ok(aboutContentService.updateAboutContent(request));
  }
}
