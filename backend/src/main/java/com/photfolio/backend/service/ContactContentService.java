package com.photfolio.backend.service;

import com.photfolio.backend.model.ContactContent;
import com.photfolio.backend.repository.ContactContentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class ContactContentService {

  private static final String CONTACT_CONTENT_ID = "contact-main";

  @Autowired
  private ContactContentRepository contactContentRepository;

  public ContactContent getContactContent() {
    ContactContent content = contactContentRepository.findById(CONTACT_CONTENT_ID).orElseGet(this::createDefaultContent);

    if (content.getInstagram() == null) {
      content.setInstagram("");
      content = contactContentRepository.save(content);
    }

    return content;
  }

  public ContactContent updateContactContent(ContactContent request) {
    ContactContent current = getContactContent();

    current.setLocation(defaultIfBlank(request.getLocation(), current.getLocation()));
    current.setEmail(defaultIfBlank(request.getEmail(), current.getEmail()));
    current.setPhone(defaultIfBlank(request.getPhone(), current.getPhone()));
    current.setInstagram(defaultIfBlank(request.getInstagram(), current.getInstagram()));

    return contactContentRepository.save(current);
  }

  public ContactContent clearContactContent() {
    ContactContent current = getContactContent();
    current.setLocation("");
    current.setEmail("");
    current.setPhone("");
    current.setInstagram("");
    return contactContentRepository.save(current);
  }

  private ContactContent createDefaultContent() {
    ContactContent defaultContent = new ContactContent(
        CONTACT_CONTENT_ID,
        "Delhi, India",
        "hello@visualnest.com",
      "+91 9XXXXXXXXX",
      "https://instagram.com/visualnest"
    );
    return contactContentRepository.save(defaultContent);
  }

  private String defaultIfBlank(String value, String fallback) {
    if (value == null || value.trim().isEmpty()) {
      return fallback;
    }
    return value.trim();
  }
}
