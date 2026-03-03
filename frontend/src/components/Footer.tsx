import { useEffect, useState } from "react";
import "../styles/footer.css";
import { fetchAboutContent, fetchContactContent } from "../services/api";
import type { ContactContent } from "../types/ContactContent";

interface FooterProps {
  theme: "light" | "dark";
  onToggleTheme: () => void;
}

const Footer = ({ theme, onToggleTheme }: FooterProps) => {
  const [profileName, setProfileName] = useState("Admin");
  const [contactContent, setContactContent] = useState<ContactContent>({
    location: "Delhi, India",
    email: "hello@visualnest.com",
    phone: "+91 9XXXXXXXXX",
    instagram: "https://instagram.com/visualnest",
  });

  const loadContactContent = async () => {
    try {
      const data = await fetchContactContent();
      setContactContent(data);
    } catch {
      setContactContent({
        location: "Delhi, India",
        email: "hello@visualnest.com",
        phone: "+91 9XXXXXXXXX",
        instagram: "https://instagram.com/visualnest",
      });
    }
  };

  const loadProfileName = async () => {
    try {
      const about = await fetchAboutContent();
      const normalizedName = (about?.name || "").trim();
      setProfileName(normalizedName || "Admin");
    } catch {
      setProfileName("Admin");
    }
  };

  const normalizedEmail = (contactContent.email || "").trim();
  const normalizedPhone = (contactContent.phone || "").trim();
  const normalizedInstagram = (contactContent.instagram || "").trim();
  const phoneHref = normalizedPhone ? `tel:${normalizedPhone.replace(/\s+/g, "")}` : "";
  const instagramHref = normalizedInstagram
    ? (/^https?:\/\//i.test(normalizedInstagram) ? normalizedInstagram : `https://${normalizedInstagram}`)
    : "https://instagram.com";

  useEffect(() => {
    const handleContactContentUpdated = () => {
      void loadContactContent();
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === "contactContentUpdatedAt") {
        void loadContactContent();
      }
    };

    void loadContactContent();
    void loadProfileName();
    window.addEventListener("contact-content-updated", handleContactContentUpdated);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("contact-content-updated", handleContactContentUpdated);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  return (
    <footer className="footer">
      <div className="footer-container">

        {/* Brand */}
        <div className="footer-brand">
          <h2>Visualnest</h2>
          <p>
            Capturing emotions, moments and stories<br />
            through timeless photography.
          </p>
        </div>

        {/* Links */}
        <div className="footer-links">
          <h4>Explore</h4>
          <a href="/">Home</a>
          <a href="/about">About</a>
          <a href="/services">Services</a>
          <a href="/gallery">Gallery</a>
          <a href="/contact">Contact</a>
        </div>

        {/* Services */}
        <div className="footer-links">
          <h4>Services</h4>
          <a href="#">Wedding Photography</a>
          <a href="#">Portrait Sessions</a>
          <a href="#">Travel Shoots</a>
          <a href="#">Event Coverage</a>
        </div>

        {/* Contact */}
        <div className="footer-contact">
          <h4>Contact</h4>
          <p className="footer-contact-item">
            <span className="footer-contact-icon" aria-hidden="true">⌖</span>
            <span>{contactContent.location || "-"}</span>
          </p>
          <p className="footer-contact-item">
            <span className="footer-contact-icon" aria-hidden="true">✉</span>
            {normalizedEmail ? (
              <a className="footer-contact-link" href={`mailto:${normalizedEmail}`}>
                {normalizedEmail}
              </a>
            ) : (
              <span>-</span>
            )}
          </p>
          <p className="footer-contact-item">
            <span className="footer-contact-icon" aria-hidden="true">☎</span>
            {normalizedPhone ? (
              <a className="footer-contact-link" href={phoneHref}>
                {normalizedPhone}
              </a>
            ) : (
              <span>-</span>
            )}
          </p>
          <p className="footer-contact-item">
            <span className="footer-contact-icon" aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="5" ry="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
              </svg>
            </span>
            <a
              className="footer-contact-link footer-contact-link-instagram"
              href={instagramHref}
              target="_blank"
              rel="noreferrer"
            >
              {profileName} Instagram Profile
            </a>
          </p>
        </div>

      </div>

      {/* Bottom */}
      <div className="footer-bottom">
        © {new Date().getFullYear()} Visualnest. All rights reserved.
        <button type="button" className="footer-theme-toggle" onClick={onToggleTheme}>
          {theme === "light" ? "Switch to Dark" : "Switch to Light"}
        </button>
        <h1>Designed by Yash goswami</h1>
      </div>
      
    </footer>
  );
};

export default Footer;
