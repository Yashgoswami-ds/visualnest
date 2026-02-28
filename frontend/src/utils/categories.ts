export type AdminCategory = {
  id: string;
  label: string;
  value: string;
  desc: string;
};

const STORAGE_KEY = "photfolio.admin.categories";

const defaults: AdminCategory[] = [
  {
    id: "wedding",
    label: "Wedding Photography",
    value: "wedding",
    desc: "Capturing timeless love stories with emotions, elegance and depth.",
  },
  {
    id: "portrait",
    label: "Portrait Sessions",
    value: "portrait",
    desc: "Natural, confident and artistic portraits crafted with soul.",
  },
  {
    id: "travel",
    label: "Travel Shoots",
    value: "travel",
    desc: "Cinematic landscapes and authentic travel narratives.",
  },
  {
    id: "event",
    label: "Event Coverage",
    value: "event",
    desc: "Corporate & private events documented professionally.",
  },
];

export const slugifyCategory = (text: string): string =>
  text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

export const getAdminCategories = (): AdminCategory[] => {
  if (typeof window === "undefined") return defaults;

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
    return defaults;
  }

  try {
    const parsed = JSON.parse(raw) as AdminCategory[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
      return defaults;
    }
    return parsed;
  } catch {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
    return defaults;
  }
};

export const saveAdminCategories = (categories: AdminCategory[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
};
