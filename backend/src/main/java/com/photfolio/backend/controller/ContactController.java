package com.photfolio.backend.controller;

import com.photfolio.backend.model.ContactQueryRequest;
import com.photfolio.backend.service.EmailService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/contact")
public class ContactController {

  @Autowired
  private EmailService emailService;

  @PostMapping("/query")
  public ResponseEntity<Map<String, String>> submitQuery(@Valid @RequestBody ContactQueryRequest request) {
    emailService.sendContactQueryToAdmin(request.getName(), request.getEmail(), request.getMessage());
    Map<String, String> response = new HashMap<>();
    response.put("message", "Your query has been sent successfully.");
    return ResponseEntity.ok(response);
  }
}
