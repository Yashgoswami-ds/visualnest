import { useEffect, useState } from "react";
import "../styles/home.css";
import About from "./About"; // About component import karo
import { fetchImages, normalizeMediaUrl } from "../services/api";

const Home = () => {
  const HOME_FIRST_CATEGORY = "home-first";
  const HOME_FALLBACK_IMAGE = "/uploads/backgroundHome.jpg";
  const newLocal = "hero-buttons";
  const [heroImageUrl, setHeroImageUrl] = useState(HOME_FALLBACK_IMAGE);

  useEffect(() => {
    const loadHomeFirstImage = async () => {
      try {
        const data = await fetchImages();
        const selected = data.find(
          (item) =>
            item.category === HOME_FIRST_CATEGORY &&
            (item.mediaType?.startsWith("image/") || /\.(jpg|jpeg|png|webp|gif)$/i.test(item.url))
        );

        if (selected?.url) {
          setHeroImageUrl(normalizeMediaUrl(selected.url));
        } else {
          setHeroImageUrl(HOME_FALLBACK_IMAGE);
        }
      } catch {
        setHeroImageUrl(HOME_FALLBACK_IMAGE);
      }
    };

    loadHomeFirstImage();
  }, []);

  return (
    <>
      {/* About Section */}
    <About />
      {/* Hero Section */}
      <section className="home">
        <div className="hero-container">
          {/* Left Image */}
          <div
            className="hero-image"
            style={heroImageUrl ? { backgroundImage: `url('${heroImageUrl}')` } : undefined}
          ></div>

          {/* Right Content */}
          <div className="hero-content">
            <h1 className="hero-title">Capturing moments<br />that last forever</h1>
            <p className="hero-subtitle">
              Wedding • Portrait • Travel Photography • Events • Commercial • More
            </p>
           <div className={newLocal} >
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


    </>
  );
};

export default Home;
