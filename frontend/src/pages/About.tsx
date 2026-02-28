import { useEffect, useState } from "react";
import "../styles/about.css";
import { fetchAboutContent, normalizeMediaUrl } from "../services/api";
import type { AboutContent } from "../types/AboutContent";

const About = () => {
  const [aboutImageUrl, setAboutImageUrl] = useState<string | null>(null);
  const [aboutContent, setAboutContent] = useState<AboutContent>({
    name: "Your Name",
    experience: "5+ Years",
    projects: "150+ Completed",
    location: "Delhi, India",
    equipment: "Sony Alpha-7, Lenses, Lighting Gear",
  });

  useEffect(() => {
    const loadAboutContent = async () => {
      try {
        const data = await fetchAboutContent();
        setAboutContent(data);
        setAboutImageUrl(data.adminPhotoUrl ? normalizeMediaUrl(data.adminPhotoUrl) : null);
      } catch {
        setAboutContent({
          name: "Your Name",
          experience: "5+ Years",
          projects: "150+ Completed",
          location: "Delhi, India",
          equipment: "Sony Alpha-7, Lenses, Lighting Gear",
        });
        setAboutImageUrl(null);
      }
    };

    loadAboutContent();
  }, []);

  return (
    <section className="about">
      <div className="about-container">
        {/* Left Image Section */}
        {aboutImageUrl && (
          <div className="about-image">
            <img src={aboutImageUrl} alt="Photographer" />
          </div>
        )}

        {/* Right Content Section */}
        <div className="about-content">
          <h1 className="about-title">
            Hello, I'm {aboutContent.name || "Your Name"}
          </h1>
          <p className="about-subtitle">
            Professional Photographer specializing in Wedding, Portrait, and Travel Photography. 
            Capturing moments that last forever with creativity, passion, and precision.
          </p>
          <ul className="about-details">
            <li><strong>Experience:</strong> {aboutContent.experience}</li>
            <li><strong>Projects:</strong> {aboutContent.projects}</li>
            <li><strong>Location:</strong> {aboutContent.location}</li>
            <li><strong>Equipment:</strong> {aboutContent.equipment}</li>
          </ul>

          <div className="about-buttons">
            <a href="/gallery" className="hero-btn view-gallery-btn">
              View Gallery
            </a>
            <a href="/contact" className="hero-btn hero-btn-secondary">
              Book a Session
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
