
export interface Image {
  id: string;
  url: string;
  title?: string;
  category?: string;
  mediaType?: string;
  mediaKind?: "image" | "video";
  section?: string;
  createdAt?: string;
  updatedAt?: string;
}
