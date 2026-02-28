import "../styles/services.css";
import { Link } from "react-router-dom";
import { getAdminCategories } from "../utils/categories";
import { useEffect, useState } from "react";
import { fetchCollectionMediaByType, fetchImagesByCategory, normalizeMediaUrl } from "../services/api";

const Services = () => {
  const SERVICES_FALLBACK_IMAGE = "/uploads/services.jpg";
  const servicesData = getAdminCategories();
  const [backgroundImage, setBackgroundImage] = useState(SERVICES_FALLBACK_IMAGE);

  useEffect(() => {
    const loadServicesBackground = async () => {
      try {
        const categoryItems = await fetchImagesByCategory("services-bg");
        let selected = categoryItems.find((item) => item.mediaType?.startsWith("image/"));

        if (!selected) {
          const collectionItems = await fetchCollectionMediaByType("background", "image");
          selected =
            collectionItems.find((item) => (item.category || "").toLowerCase().includes("service")) ||
            collectionItems[0];
        }

        setBackgroundImage(selected?.url ? normalizeMediaUrl(selected.url) : SERVICES_FALLBACK_IMAGE);
      } catch {
        setBackgroundImage(SERVICES_FALLBACK_IMAGE);
      }
    };

    loadServicesBackground();
  }, []);

  return (
    <section className="services">
      <div className="services-layout">

        {/* LEFT IMAGE */}
        <div
          className="services-bg"
          style={backgroundImage ? { backgroundImage: `url('${backgroundImage}')` } : undefined}
        />

        {/* RIGHT CONTENT (SAME AS BEFORE) */}
        <div className="services-container">

          <div className="services-intro">
            <span className="services-eyebrow">SERVICES</span>
            <h1>
              Crafted with passion,<br />
              captured with purpose
            </h1>
            <p>
              Every service is designed to preserve emotions,
              tell stories and create lasting impressions.
            </p>
          </div>

          <div className="services-list">
            {servicesData.map((item, index) => (
              <div className="service-item" key={index}>
                <div className="service-no">{String(index + 1).padStart(2, "0")}</div>

                <div className="service-content">
                  <h3>{item.label}</h3>
                  <p>{item.desc}</p>
                  <Link to={`/gallery?category=${encodeURIComponent(item.value)}`}>
                    View this category →
                  </Link>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
};

export default Services;
