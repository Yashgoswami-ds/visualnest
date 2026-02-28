import "../styles/image-frame.css";

interface Props {
  src: string;
  alt?: string;
  isVideo?: boolean;
  showOverlay?: boolean;
  autoPlayVideo?: boolean;
}

const ImageFrame = ({ src, alt, isVideo = false, showOverlay = true, autoPlayVideo = false }: Props) => {
  return (
    <div className="image-frame">
      {isVideo ? (
        <video
          src={src}
          controls
          playsInline
          autoPlay={autoPlayVideo}
          muted={autoPlayVideo}
          loop={autoPlayVideo}
        />
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
  );
};

export default ImageFrame;
