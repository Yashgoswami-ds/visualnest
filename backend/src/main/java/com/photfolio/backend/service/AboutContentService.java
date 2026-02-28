package com.photfolio.backend.service;

import com.photfolio.backend.model.AboutContent;
import com.photfolio.backend.model.ImageDto;
import com.photfolio.backend.repository.AboutContentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class AboutContentService {

  private static final String ABOUT_CONTENT_ID = "about-main";

  @Autowired
  private AboutContentRepository aboutContentRepository;

  @Autowired
  private GalleryService galleryService;

  public AboutContent getAboutContent() {
    AboutContent content = aboutContentRepository.findById(ABOUT_CONTENT_ID).orElseGet(this::createDefaultContent);

    ImageDto adminPhoto = galleryService.getLatestByCategory("about-profile");
    ImageDto adminVideo = galleryService.getLatestByCategory("about-video");

    content.setAdminPhotoUrl(adminPhoto != null ? adminPhoto.getUrl() : null);
    content.setAdminVideoUrl(adminVideo != null ? adminVideo.getUrl() : null);

    return content;
  }

  public AboutContent updateAboutContent(AboutContent request) {
    AboutContent current = getAboutContent();

    current.setName(defaultIfBlank(request.getName(), current.getName()));
    current.setExperience(defaultIfBlank(request.getExperience(), current.getExperience()));
    current.setProjects(defaultIfBlank(request.getProjects(), current.getProjects()));
    current.setLocation(defaultIfBlank(request.getLocation(), current.getLocation()));
    current.setEquipment(defaultIfBlank(request.getEquipment(), current.getEquipment()));

    return aboutContentRepository.save(current);
  }

  private AboutContent createDefaultContent() {
    AboutContent defaultContent = new AboutContent(
        ABOUT_CONTENT_ID,
      "Nitish",
        "5+ Years",
        "150+ Completed",
        "Delhi, India",
        "Sony Alpha-7, Lenses, Lighting Gear"
    );
    return aboutContentRepository.save(defaultContent);
  }

  private String defaultIfBlank(String value, String fallback) {
    if (value == null || value.trim().isEmpty()) {
      return fallback;
    }
    return value.trim();
  }
}
