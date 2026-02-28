package com.photfolio.backend.controller;

import com.photfolio.backend.model.ContactContent;
import com.photfolio.backend.service.ContactContentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/content/contact")
public class ContactContentController {

  @Autowired
  private ContactContentService contactContentService;

  @GetMapping
  public ResponseEntity<ContactContent> getContactContent() {
    return ResponseEntity.ok(contactContentService.getContactContent());
  }

  @PutMapping
  public ResponseEntity<ContactContent> updateContactContent(@RequestBody ContactContent request) {
    return ResponseEntity.ok(contactContentService.updateContactContent(request));
  }

  @DeleteMapping
  public ResponseEntity<Map<String, String>> clearContactContent() {
    contactContentService.clearContactContent();
    Map<String, String> response = new HashMap<>();
    response.put("message", "Contact details cleared successfully");
    return ResponseEntity.ok(response);
  }
}
