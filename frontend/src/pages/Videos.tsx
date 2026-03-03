import { Container, Grid } from "@mantine/core";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import ImageFrame from "../components/ImageFrame";
import { fetchImages, fetchImagesByCategory, normalizeMediaUrl } from "../services/api";
import type { Image } from "../types/Image";
import "../styles/videos.css";
import { getAdminCategories } from "../utils/categories";

const isVideoUrl = (url: string) => /\.(mp4|webm|ogg|mov|m4v)$/i.test(url);

const Videos = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get("category") || "all";

  const [videos, setVideos] = useState<Image[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [loading, setLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(10);

  const categoryOptions = [
    { id: "all", label: "All Videos" },
    ...getAdminCategories().map((item) => ({ id: item.value, label: item.label })),
  ];

  useEffect(() => {
    const loadVideos = async () => {
      setLoading(true);
      try {
        const media = selectedCategory === "all"
          ? await fetchImages()
          : await fetchImagesByCategory(selectedCategory);
        const onlyVideos = media.filter((item) => item.mediaType?.startsWith("video/") || isVideoUrl(item.url));
        setVideos(
          onlyVideos.map((item) => ({
            ...item,
            url: normalizeMediaUrl(item.url),
          }))
        );
      } catch (error) {
        console.error("Failed to load videos", error);
      } finally {
        setLoading(false);
      }
    };

    loadVideos();
  }, [selectedCategory]);

  useEffect(() => {
    setVisibleCount(10);
    if (selectedCategory === "all") {
      setSearchParams({});
    } else {
      setSearchParams({ category: selectedCategory });
    }
  }, [selectedCategory, setSearchParams]);

  const visibleVideos = videos.slice(0, visibleCount);
  const hasMore = videos.length > visibleCount;

  return (
    <section className="videos-section">
      <Container size="xl">
        <div className="videos-intro">
          <span>VIDEO SECTION</span>
          <h1>Featured Moments in Motion</h1>
          <p>Your uploaded videos appear here automatically.</p>
        </div>

        <div className="videos-categories">
          {categoryOptions.map((cat) => (
            <button
              key={cat.id}
              className={`videos-category-btn ${selectedCategory === cat.id ? "active" : ""}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="videos-empty">Loading...</div>
        ) : videos.length === 0 ? (
          <div className="videos-empty">No videos uploaded yet.</div>
        ) : (
          <>
            <Grid gutter="md">
              {visibleVideos.map((video, index) => (
                <Grid.Col key={video.id || index} span={{ base: 12, sm: 6, md: 4 }}>
                  <ImageFrame
                    src={video.url}
                    alt={video.title || `video-${index}`}
                    isVideo
                    showOverlay={false}
                    autoPlayVideo
                    customVideoControls
                  />
                  <div className="video-meta">
                    <h3 className="video-meta-title">{video.title || "Untitled video"}</h3>
                    <p className="video-meta-category">{video.category || "general"}</p>
                  </div>
                </Grid.Col>
              ))}
            </Grid>

            {hasMore && (
              <div className="videos-load-more-wrap">
                <button
                  className="videos-load-more"
                  onClick={() => setVisibleCount((prev) => prev + 10)}
                >
                  +
                </button>
              </div>
            )}
          </>
        )}

        <div className="videos-back-link-wrap">
          <Link to="/gallery" className="videos-back-link">Back to Photos</Link>
        </div>
      </Container>
    </section>
  );
};

export default Videos;
