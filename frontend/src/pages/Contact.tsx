import { useEffect, useState } from "react";
import "../styles/contact.css";
import { fetchCollectionMediaByType, fetchImagesByCategory, normalizeMediaUrl, sendContactQuery } from "../services/api";

const Contact = () => {
  const CONTACT_FALLBACK_IMAGE = "/uploads/contact.jpg";
  const [backgroundImage, setBackgroundImage] = useState(CONTACT_FALLBACK_IMAGE);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const loadContactBackground = async () => {
      try {
        const categoryItems = await fetchImagesByCategory("contact-bg");
        let selected = categoryItems.find((item) => item.mediaType?.startsWith("image/"));

        if (!selected) {
          const collectionItems = await fetchCollectionMediaByType("background", "image");
          selected =
            collectionItems.find((item) => (item.category || "").toLowerCase().includes("contact")) ||
            collectionItems[0];
        }

        setBackgroundImage(selected?.url ? normalizeMediaUrl(selected.url) : CONTACT_FALLBACK_IMAGE);
      } catch {
        setBackgroundImage(CONTACT_FALLBACK_IMAGE);
      }
    };

    loadContactBackground();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("");
    setError("");

    try {
      const normalizedName = name.trim();
      const normalizedEmail = email.trim();
      const normalizedMessage = message.trim();

      if (!normalizedName || !normalizedEmail || !normalizedMessage) {
        setError("Please fill all fields before sending.");
        return;
      }

      setSending(true);
      await sendContactQuery(normalizedName, normalizedEmail, normalizedMessage);
      setStatus("Your query has been sent successfully.");
      setName("");
      setEmail("");
      setMessage("");
    } catch (err) {
      if (err instanceof Error && err.message) {
        setError(err.message);
      } else {
        setError("Failed to send message. Please try again.");
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <section
      className="contact-page"
      style={backgroundImage ? {
        backgroundImage: `url('${backgroundImage}')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      } : undefined}
    >
      <div className="contact-overlay">
        <div className="contact-container">
          {/* Header */}
          <div className="contact-header">
            <span>CONTACT</span>
            <h1>Get in Touch</h1>
            <p>
              Have a project, session, or collaboration in mind? Let's create
              something unforgettable together.
            </p>
          </div>

          {/* Form */}
          <form className="contact-form" onSubmit={handleSubmit}>
            {error && <p className="contact-error">{error}</p>}
            {status && <p className="contact-success">{status}</p>}
            <div className="form-group">
              <input
                type="text"
                placeholder="Your Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <input
                type="email"
                placeholder="Your Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <textarea
                placeholder="Your Message"
                rows={6}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="contact-btn" disabled={sending}>
              {sending ? "Sending..." : "Send Message"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default Contact;
