import { useEffect, useRef, useState } from "react";
import "../styles/image-frame.css";

interface Props {
  src: string;
  alt?: string;
  isVideo?: boolean;
  showOverlay?: boolean;
  autoPlayVideo?: boolean;
  customVideoControls?: boolean;
}

const ImageFrame = ({
  src,
  alt,
  isVideo = false,
  showOverlay = true,
  autoPlayVideo = false,
  customVideoControls = false,
}: Props) => {
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(autoPlayVideo);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canQuickView = showOverlay && !isVideo;
  const shouldUseCustomVideoControls = isVideo && customVideoControls;

  useEffect(() => {
    if (!isQuickViewOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsQuickViewOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isQuickViewOpen]);

  useEffect(() => {
    if (!isVideo) {
      return;
    }

    setIsVideoPlaying(autoPlayVideo);
  }, [isVideo, autoPlayVideo, src]);

  const toggleVideoPlayback = () => {
    if (!videoRef.current) {
      return;
    }

    if (videoRef.current.paused) {
      void videoRef.current.play();
    } else {
      videoRef.current.pause();
    }
  };

  return (
    <>
      <div
        className={`image-frame ${canQuickView ? "quick-view-enabled" : ""}`}
        onClick={canQuickView ? () => setIsQuickViewOpen(true) : undefined}
        role={canQuickView ? "button" : undefined}
        tabIndex={canQuickView ? 0 : undefined}
        onKeyDown={
          canQuickView
            ? (event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setIsQuickViewOpen(true);
                }
              }
            : undefined
        }
      >
        {isVideo ? (
          <>
            <video
              ref={videoRef}
              src={src}
              controls={!shouldUseCustomVideoControls}
              playsInline
              autoPlay={autoPlayVideo}
              muted={autoPlayVideo}
              loop={autoPlayVideo}
              onPlay={() => setIsVideoPlaying(true)}
              onPause={() => setIsVideoPlaying(false)}
            />
            {shouldUseCustomVideoControls && (
              <button
                type="button"
                className="video-play-pause-btn"
                onClick={toggleVideoPlayback}
                aria-label={isVideoPlaying ? "Pause video" : "Play video"}
              >
                {isVideoPlaying ? (
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M8 6.5V17.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                    <path d="M16 6.5V17.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M8 6.5L17 12L8 17.5V6.5Z" fill="currentColor" />
                  </svg>
                )}
              </button>
            )}
          </>
        ) : (
          <img src={src} alt={alt || "gallery image"} />
        )}
        {showOverlay && (
          <div className="image-overlay">
            <span className="image-overlay-chip" aria-hidden="true">
              <svg
                className="image-overlay-icon"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M2 12C3.9 8.4 7.5 6 12 6C16.5 6 20.1 8.4 22 12C20.1 15.6 16.5 18 12 18C7.5 18 3.9 15.6 2 12Z"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
              </svg>
              Quick View
            </span>
          </div>
        )}
      </div>

      {canQuickView && isQuickViewOpen && (
        <div className="image-quick-view" onClick={() => setIsQuickViewOpen(false)}>
          <button
            type="button"
            className="image-quick-view-close"
            onClick={(event) => {
              event.stopPropagation();
              setIsQuickViewOpen(false);
            }}
            aria-label="Close quick view"
          >
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path
                d="M6 6L18 18M18 6L6 18"
                stroke="currentColor"
                strokeWidth="2.1"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <div className="image-quick-view-content" onClick={(event) => event.stopPropagation()}>
            <img src={src} alt={alt || "gallery image"} className="image-quick-view-media" />
          </div>
        </div>
      )}
    </>
  );
};

export default ImageFrame;
