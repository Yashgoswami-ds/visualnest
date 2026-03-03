import { useState, useEffect } from "react";
import { uploadImages, fetchImages, deleteImage, normalizeMediaUrl } from "../services/api";
import type { Image } from "../types/Image";

const AdminGallery = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>("");

  const isVideoMedia = (item: Image): boolean => {
    if (item.mediaKind) {
      return item.mediaKind === "video";
    }
    const type = item.mediaType?.toLowerCase() ?? "";
    return type.startsWith("video/");
  };

  // Fetch existing images from backend
  const loadImages = async () => {
    try {
      const imgs = await fetchImages();
      setImages(
        imgs.map((item) => ({
          ...item,
          url: normalizeMediaUrl(item.url),
        }))
      );
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadImages();
  }, []);

  // Handle file selection
  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  // Handle upload
  const handleUpload = async () => {
    if (files.length === 0) {
      setMessage("Select files first!");
      return;
    }
    setLoading(true);
    try {
      const uploadedItems: Image[] = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("title", file.name);
        formData.append("category", "general");
        const uploaded = await uploadImages(formData);
        uploadedItems.push({
          ...uploaded,
          url: normalizeMediaUrl(uploaded.url),
        });
      }
      setImages([...images, ...uploadedItems]);
      setFiles([]);
      setMessage("Upload successful!");
    } catch (err) {
      console.error(err);
      setMessage("Upload failed!");
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    try {
      await deleteImage(id);
      setImages(images.filter((img) => img.id !== id));
      setMessage("Delete successful!");
    } catch (err) {
      console.error(err);
      setMessage("Delete failed!");
    }
  };

  return (
    <div>
      <h1>Admin Gallery Upload</h1>
      {message && <p>{message}</p>}

      <input type="file" multiple onChange={handleFilesChange} />
      <button onClick={handleUpload} disabled={loading}>
        {loading ? "Uploading..." : "Upload"}
      </button>

      <h2>Uploaded Images</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
        {images.map((img) => (
          <div key={img.id} style={{ position: "relative" }}>
            {isVideoMedia(img) ? (
              <video src={img.url} width={150} controls muted playsInline />
            ) : (
              <img src={img.url} alt={img.title} width={150} />
            )}
            <button
              style={{ position: "absolute", top: 0, right: 0 }}
              onClick={() => handleDelete(img.id)}
            >
              X
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminGallery;
