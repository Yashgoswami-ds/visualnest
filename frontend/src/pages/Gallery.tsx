import { Container, Grid } from "@mantine/core";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import ImageFrame from "../components/ImageFrame";
import { fetchImages, fetchImagesByCategory, normalizeMediaUrl } from "../services/api";
import type { Image } from "../types/Image";
import "../styles/gallery.css";
import { getAdminCategories } from "../utils/categories";

type GalleryMedia = {
  src: string;
  alt: string;
  isVideo?: boolean;
};

const Gallery = () => {
  const hiddenGalleryCategories = new Set([
    "about-profile",
    "home-first",
    "about-video",
    "background",
    "admin",
    "admin-photo",
    "admin-video",
  ]);
  const hiddenGalleryPrefixes = ["admin-"];
  const isHiddenGalleryCategory = (value: string) => {
    const normalized = (value || "").trim().toLowerCase();
    if (!normalized) {
      return false;
    }
    if (hiddenGalleryCategories.has(normalized)) {
      return true;
    }
    if (normalized.endsWith("-bg")) {
      return true;
    }
    return hiddenGalleryPrefixes.some((prefix) => normalized.startsWith(prefix));
  };

  const isHiddenGalleryMedia = (item: Image) => {
    if (isHiddenGalleryCategory(item.category || "")) {
      return true;
    }

    const kind = (item.mediaKind || "").trim().toLowerCase();
    if (kind === "background") {
      return true;
    }

    const section = (item.section || "").trim().toLowerCase();
    if (section === "admin" || section === "background") {
      return true;
    }

    return false;
  };
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get("category") || "all";

  const [dbImages, setDbImages] = useState<Image[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [visibleCount, setVisibleCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const categoryOptions = [
    { id: "all", label: "All Media" },
    ...getAdminCategories()
      .filter((item) => !isHiddenGalleryCategory(item.value))
      .map((item) => ({ id: item.value, label: item.label })),
  ];

  useEffect(() => {
    const loadImages = async () => {
      setLoading(true);
      try {
        const response = selectedCategory === "all"
          ? await fetchImages() 
          : await fetchImagesByCategory(selectedCategory);
        const filtered = response.filter((item) => !isHiddenGalleryMedia(item));
        setDbImages(filtered);
      } catch (error) {
        console.error("Failed to load gallery images", error);
      } finally {
        setLoading(false);
      }
    };

    loadImages();
  }, [selectedCategory]);

  useEffect(() => {
    setVisibleCount(10);
    if (selectedCategory === "all") {
      setSearchParams({});
    } else {
      setSearchParams({ category: selectedCategory });
    }
  }, [selectedCategory, setSearchParams]);

  const displayImages: GalleryMedia[] = dbImages.map((img, index) => ({
    src: normalizeMediaUrl(img.url),
    alt: img.title || `gallery-${index}`,
    isVideo: img.mediaType?.startsWith("video/"),
  }));

  // Filter out videos if showing photos only
  const photos = displayImages.filter(item => !item.isVideo);
  const visiblePhotos = photos.slice(0, visibleCount);
  const hasMore = photos.length > visibleCount;

  return (
    <section className="gallery">
      <Container size="xl">
        {/* Header */}
        <div className="gallery-intro">
          <span>GALLERY</span>
          <h1>Moments captured in frames</h1>
          <p>A curated collection of emotions and timeless visuals.</p>
        </div>

        {/* Category Filter */}
        <div className="gallery-categories">
          {categoryOptions.map((cat) => (
            <button
              key={cat.id}
              className={`category-btn ${selectedCategory === cat.id ? "active" : ""}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="gallery-loading">Loading...</div>
        ) : photos.length > 0 ? (
          <>
            <Grid gutter="md">
              {visiblePhotos.map((item, index) => (
                <Grid.Col
                  key={index}
                  span={{ base: 12, sm: 6, md: 4 }}
                >
                  <ImageFrame src={item.src} alt={item.alt} />
                </Grid.Col>
              ))}
            </Grid>
            {hasMore && (
              <div className="gallery-load-more-wrap">
                <button
                  className="gallery-load-more"
                  onClick={() => setVisibleCount((prev) => prev + 10)}
                >
                  +
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="gallery-empty">
            No photos found for this category.
          </div>
        )}

        <div className="gallery-video-cta">
          <Link to="/videos" className="gallery-video-button">
            Go to Video Section
          </Link>
        </div>
      </Container>
    </section>
  );
};

export default Gallery;
