import { useEffect, useMemo, useState } from "react";
import { fetchImagesByCategory, normalizeMediaUrl } from "../services/api";
import type { Image } from "../types/Image";

const pickLatestImage = (media: Image[]) => {
  const imagesOnly = media.filter((item) => (item.mediaKind || "image") === "image" && !!item.url);
  if (!imagesOnly.length) {
    return null;
  }

  return [...imagesOnly].sort((a, b) => {
    const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime();
    const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime();
    return bTime - aTime;
  })[0];
};

export const useAdminAuthBackground = (
  categories: string[],
  fallbackUrl: string = "/uploads/aglogin.jpg"
) => {
  const categoryKey = categories.join("|");
  const storageKey = `admin-auth-bg:${categoryKey}`;
  const [cacheBuster] = useState(() => Date.now());
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(() => {
    try {
      const cached = window.localStorage.getItem(storageKey);
      return cached && cached.trim() ? cached : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    let mounted = true;

    const loadBackground = async () => {
      for (const category of categoryKey.split("|").filter(Boolean)) {
        try {
          const media = await fetchImagesByCategory(category);
          const latest = pickLatestImage(media);

          if (latest?.url && mounted) {
            const normalized = normalizeMediaUrl(latest.url);
            setBackgroundUrl(normalized);
            try {
              window.localStorage.setItem(storageKey, normalized);
            } catch {
              return;
            }
            return;
          }
        } catch {
          continue;
        }
      }

      if (mounted) {
        setBackgroundUrl(fallbackUrl);
        try {
          window.localStorage.removeItem(storageKey);
        } catch {
          return;
        }
      }
    };

    loadBackground();

    return () => {
      mounted = false;
    };
  }, [categoryKey, fallbackUrl, storageKey]);

  return useMemo(() => {
    if (!backgroundUrl) {
      return undefined;
    }

    const separator = backgroundUrl.includes("?") ? "&" : "?";
    return {
      backgroundImage: `url(${backgroundUrl}${separator}v=${cacheBuster})`,
    };
  }, [backgroundUrl, cacheBuster]);
};
