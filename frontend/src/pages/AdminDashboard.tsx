import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/admin.css";
import {
  approveAccessRequest,
  checkAdminSession,
  deleteContactContent,
  deleteImage,
  fetchAboutContent,
  fetchApprovedAccessUsers,
  fetchCurrentAdminProfile,
  fetchAccessPolicy,
  fetchContactContent,
  fetchImages,
  fetchOnlyImages,
  fetchOnlyVideos,
  fetchPendingAccessRequests,
  normalizeMediaUrl,
  rejectAccessRequest,
  revokeAccessUser,
  updateAboutContent,
  updateAccessPolicy,
  updateContactContent,
  updateImage,
  uploadImages,
  type AccessPolicy,
  type ApprovedAccessUser,
  type CurrentAdminProfile,
  type PendingAccessRequest,
} from "../services/api";
import type { AboutContent } from "../types/AboutContent";
import type { ContactContent } from "../types/ContactContent";
import type { Image } from "../types/Image";
import { type AdminCategory, getAdminCategories, saveAdminCategories, slugifyCategory } from "../utils/categories";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const HOME_FIRST_CATEGORY = "home-first";
  const ABOUT_PROFILE_CATEGORY = "about-profile";
  const MAX_IMAGE_MB = 2;
  const MAX_VIDEO_MB = 20;
  const MAX_IMAGE_BYTES = MAX_IMAGE_MB * 1024 * 1024;
  const MAX_VIDEO_BYTES = MAX_VIDEO_MB * 1024 * 1024;
  const [images, setImages] = useState<Image[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("general");
  const [categoryComboOpen, setCategoryComboOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categoryModalMode, setCategoryModalMode] = useState<"add" | "edit">("add");
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [categoryTitleInput, setCategoryTitleInput] = useState("");
  const [categoryDescInput, setCategoryDescInput] = useState("");
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [homeFirstPhotoFile, setHomeFirstPhotoFile] = useState<File | null>(null);
  const [updatingHomePhoto, setUpdatingHomePhoto] = useState(false);
  const [aboutPhotoFile, setAboutPhotoFile] = useState<File | null>(null);
  const [updatingAboutPhoto, setUpdatingAboutPhoto] = useState(false);
  const [aboutContent, setAboutContent] = useState<AboutContent>({
    name: "Your Name",
    experience: "5+ Years",
    projects: "150+ Completed",
    location: "Delhi, India",
    equipment: "Sony Alpha-7, Lenses, Lighting Gear",
  });
  const [savingAboutContent, setSavingAboutContent] = useState(false);
  const [contactContent, setContactContent] = useState<ContactContent>({
    location: "Delhi, India",
    email: "hello@photoportfolio.com",
    phone: "+91 9XXXXXXXXX",
    instagram: "https://instagram.com/photoportfolio",
  });
  const [savingContactContent, setSavingContactContent] = useState(false);
  const [deletingContactContent, setDeletingContactContent] = useState(false);
  const [replacingPrivateId, setReplacingPrivateId] = useState<string | null>(null);
  const [accessPolicy, setAccessPolicy] = useState<AccessPolicy | null>(null);
  const [pendingRequests, setPendingRequests] = useState<PendingAccessRequest[]>([]);
  const [approvedUsers, setApprovedUsers] = useState<ApprovedAccessUser[]>([]);
  const [accessPolicyInput, setAccessPolicyInput] = useState("3");
  const [loadingAccessPanel, setLoadingAccessPanel] = useState(false);
  const [savingAccessPolicy, setSavingAccessPolicy] = useState(false);
  const [processingAccessEmail, setProcessingAccessEmail] = useState<string | null>(null);
  const [showAccessControls, setShowAccessControls] = useState(true);
  const [currentAdmin, setCurrentAdmin] = useState<CurrentAdminProfile | null>(null);
  const categoryComboRef = useRef<HTMLDivElement | null>(null);

  const notifyContactContentUpdated = () => {
    const updateStamp = Date.now().toString();
    localStorage.setItem("contactContentUpdatedAt", updateStamp);
    window.dispatchEvent(new CustomEvent("contact-content-updated", { detail: updateStamp }));
  };

  const loadAccessControls = async () => {
    setLoadingAccessPanel(true);
    try {
      const policy = await fetchAccessPolicy();
      setAccessPolicy(policy);
      setAccessPolicyInput(String(policy.maxApprovedAdmins || 1));
      setShowAccessControls(true);

      const [pendingResult, approvedResult] = await Promise.allSettled([
        fetchPendingAccessRequests(),
        fetchApprovedAccessUsers(),
      ]);

      if (pendingResult.status === "fulfilled") {
        setPendingRequests(pendingResult.value);
      }

      if (approvedResult.status === "fulfilled") {
        setApprovedUsers(approvedResult.value);
      }
    } catch (err) {
      if (
        err instanceof Error
        && /super admin|forbidden|access denied|403/i.test(err.message)
      ) {
        setShowAccessControls(false);
        return;
      }
      setShowAccessControls(true);
    } finally {
      setLoadingAccessPanel(false);
    }
  };

  const handleSaveAccessPolicy = async () => {
    const parsedMax = Number.parseInt(accessPolicyInput, 10);
    if (Number.isNaN(parsedMax) || parsedMax < 1) {
      setMessage({ type: "error", text: "Max approved admins must be at least 1." });
      return;
    }

    setSavingAccessPolicy(true);
    try {
      const updated = await updateAccessPolicy(parsedMax);
      setAccessPolicy(updated);
      setAccessPolicyInput(String(updated.maxApprovedAdmins));
      setMessage({ type: "success", text: "Access policy updated." });
      await loadAccessControls();
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to update access policy." });
    } finally {
      setSavingAccessPolicy(false);
    }
  };

  const handleApproveRequest = async (email: string) => {
    setProcessingAccessEmail(email);
    try {
      await approveAccessRequest(email);
      setMessage({ type: "success", text: `Access approved for ${email}.` });
      await loadAccessControls();
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to approve access request." });
    } finally {
      setProcessingAccessEmail(null);
    }
  };

  const handleRejectRequest = async (email: string) => {
    setProcessingAccessEmail(email);
    try {
      await rejectAccessRequest(email);
      setMessage({ type: "success", text: `Access rejected for ${email}.` });
      await loadAccessControls();
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to reject access request." });
    } finally {
      setProcessingAccessEmail(null);
    }
  };

  const handleRevokeAccess = async (email: string) => {
    setProcessingAccessEmail(email);
    try {
      await revokeAccessUser(email);
      setMessage({ type: "success", text: `Access removed for ${email}.` });
      await loadAccessControls();
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to remove access." });
    } finally {
      setProcessingAccessEmail(null);
    }
  };

  const isVideoUrl = (url: string) => /\.(mp4|webm|ogg|mov|m4v)$/i.test(url);
  const isVideoMedia = (img: Image) =>
      img.mediaType?.startsWith("video/") || isVideoUrl(img.url);
  const validateUploadSize = (targetFile: File) => {
    const isImage = targetFile.type.startsWith("image/");
    const isVideo = targetFile.type.startsWith("video/");

    if (!isImage && !isVideo) {
      return "Only image and video files are allowed.";
    }

    if (isImage && targetFile.size > MAX_IMAGE_BYTES) {
      return `Image is too large. Max allowed is ${MAX_IMAGE_MB}MB.`;
    }

    if (isVideo && targetFile.size > MAX_VIDEO_BYTES) {
      return `Video is too large. Max allowed is ${MAX_VIDEO_MB}MB.`;
    }

    return null;
  };
  const privateUploadCategories = new Set([
    "about-profile",
    "home-first",
    "about-video",
    "contact-bg",
    "services-bg",
    "background",
    "admin",
    "admin-photo",
    "admin-video",
  ]);
  const isPrivateCategoryValue = (value: string) => {
    const normalizedCategory = (value || "").trim().toLowerCase();

    if (privateUploadCategories.has(normalizedCategory)) {
      return true;
    }

    if (normalizedCategory.endsWith("-bg") || normalizedCategory.startsWith("admin-")) {
      return true;
    }

    return false;
  };

  const isPrivateUploadImage = (img: Image) => {
    const normalizedCategory = (img.category || "").trim().toLowerCase();
    const normalizedSection = (img.section || "").trim().toLowerCase();

    if (isPrivateCategoryValue(normalizedCategory)) {
      return true;
    }

    if (normalizedSection === "admin" || normalizedSection === "background") {
      return true;
    }

    return false;
  };

  const categoryOptions: AdminCategory[] = [
    {
      id: "general",
      label: "general",
      value: "general",
      desc: "Default category",
    },
    {
      id: "admin-login-bg",
      label: "Login Background",
      value: "admin-login-bg",
      desc: "Single background for login, create user, access request, forgot/reset password pages",
    },
    {
      id: "contact-bg",
      label: "Contact Background",
      value: "contact-bg",
      desc: "Background for contact section",
    },
    {
      id: "services-bg",
      label: "Services Background",
      value: "services-bg",
      desc: "Background for services section",
    },
    {
      id: "home-first",
      label: "Home Hero",
      value: "home-first",
      desc: "Primary home hero image",
    },
    {
      id: "about-profile",
      label: "About Profile",
      value: "about-profile",
      desc: "About admin profile image",
    },
    {
      id: "about-video",
      label: "About Video",
      value: "about-video",
      desc: "About section video",
    },
    ...categories.filter((item) => item.value !== "general"),
  ].filter((item, index, arr) => arr.findIndex((entry) => entry.value === item.value) === index);
  const selectedCategoryLabel =
      categoryOptions.find((item) => item.value === category)?.label || category;

 const logout = () => {
  localStorage.removeItem("adminToken");
  localStorage.removeItem("adminAuth");
  navigate("/", { replace: true });
};

  const getEmailFromToken = () => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        return "";
      }

      const payload = token.split(".")[1];
      if (!payload) {
        return "";
      }

      const decodedPayload = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
      const parsed = JSON.parse(decodedPayload) as { sub?: string };
      return typeof parsed.sub === "string" ? parsed.sub.trim() : "";
    } catch {
      return "";
    }
  };

  const formatAdminDisplayName = () => {
    const rawName = currentAdmin?.name?.trim();
    if (rawName) {
      return rawName;
    }

    const email = currentAdmin?.email?.trim() || getEmailFromToken();
    if (!email) {
      return "Admin User";
    }

    const localPart = email.split("@")[0] || email;
    return localPart
      .replace(/[._-]+/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const confirmDelete = (id?: string) => {
    if (!id) return;
    setDeleteTarget(id);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteImage(deleteTarget);
      setImages((prev) => prev.filter((img) => img.id !== deleteTarget));
      setMessage({ type: "success", text: "Media deleted successfully." });
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Delete failed." });
    } finally {
      setDeleteTarget(null);
    }
  };

  const startEdit = (item: Image) => {
    if (!item.id) return;
    setEditId(item.id);
    setEditTitle(item.title || "");
    setEditCategory(item.category || "general");
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditTitle("");
    setEditCategory("");
  };

  const handleUpdate = async (item: Image) => {
    if (!item.id) return;

    try {
      const updated = await updateImage(item.id, {
        ...item,
        title: editTitle.trim() || item.title,
        category: editCategory.trim() || item.category,
      });

      setImages((prev) =>
        prev.map((img) =>
          img.id === item.id
            ? { ...updated, url: normalizeMediaUrl(updated.url) }
            : img
        )
      );
      cancelEdit();
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Update failed." });
    }
  };


  // Load images
  const loadImages = async () => {
    try {
      const [imagesData, videosData, allData] = await Promise.all([
        fetchOnlyImages(),
        fetchOnlyVideos(),
        fetchImages(),
      ]);

      const mergedMap = new Map<string, Image>();
      [...imagesData, ...videosData, ...allData].forEach((item) => {
        if (!item?.id) {
          return;
        }
        mergedMap.set(item.id, {
          ...item,
          url: normalizeMediaUrl(item.url),
        });
      });

      setImages(
        Array.from(mergedMap.values())
      );
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadImages();
    loadAccessControls();
    setCategories(getAdminCategories());

    const loadCurrentAdmin = async () => {
      try {
        const profile = await fetchCurrentAdminProfile();
        setCurrentAdmin(profile);
      } catch (err) {
        console.error(err);
      }
    };

    const loadAboutContent = async () => {
      try {
        const data = await fetchAboutContent();
        setAboutContent(data);
      } catch {
        setAboutContent({
          name: "Your Name",
          experience: "5+ Years",
          projects: "150+ Completed",
          location: "Delhi, India",
          equipment: "Sony Alpha-7, Lenses, Lighting Gear",
        });
      }
    };

    const loadContactContent = async () => {
      try {
        const data = await fetchContactContent();
        setContactContent(data);
      } catch {
        setContactContent({
          location: "Delhi, India",
          email: "hello@photoportfolio.com",
          phone: "+91 9XXXXXXXXX",
          instagram: "https://instagram.com/photoportfolio",
        });
      }
    };

    loadAboutContent();
    loadContactContent();
    loadCurrentAdmin();
  }, []);

  useEffect(() => {
    let isMounted = true;

    const forceLogout = () => {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminAuth");
      navigate("/admin-login", { replace: true });
    };

    const verifyActiveSession = async () => {
      try {
        await checkAdminSession();
      } catch (err) {
        if (!isMounted) {
          return;
        }

        if (err instanceof Error && /session expired|unauthorized|forbidden/i.test(err.message)) {
          forceLogout();
        }
      }
    };

    void verifyActiveSession();
    const interval = window.setInterval(() => {
      void verifyActiveSession();
    }, 5000);

    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, [navigate]);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(null), 1800);
    return () => window.clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!categoryComboRef.current) {
        return;
      }

      if (!categoryComboRef.current.contains(event.target as Node)) {
        setCategoryComboOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  // Upload handler
 const handleUpload = async () => {
  if (!file) {
    setMessage({ type: "error", text: "Please select a file." });
    return;
  }

  const sizeValidationError = validateUploadSize(file);
  if (sizeValidationError) {
    setMessage({ type: "error", text: sizeValidationError });
    return;
  }

  const selectedCategory = (category.trim() || "general").toLowerCase();
  const isImageUpload = file.type.startsWith("image/");
  const enforceSinglePrivatePhoto = isImageUpload && isPrivateCategoryValue(selectedCategory);

  const formData = new FormData();
  formData.append("file", file);
  formData.append("title", title.trim() || file.name);
  formData.append("category", category.trim() || "general");

  setLoading(true);
  try {
    if (enforceSinglePrivatePhoto) {
      const existingPrivateCategoryImages = images.filter((item) => {
        const itemCategory = (item.category || "").trim().toLowerCase();
        return item.id && !isVideoMedia(item) && itemCategory === selectedCategory;
      });

      for (const existingImage of existingPrivateCategoryImages) {
        if (existingImage.id) {
          await deleteImage(existingImage.id);
        }
      }
    }

    const uploaded = await uploadImages(formData);
    const normalizedUploaded = {
      ...uploaded,
      url: normalizeMediaUrl(uploaded.url),
    };

    setImages((prev) => {
      if (!enforceSinglePrivatePhoto) {
        return [...prev, normalizedUploaded];
      }

      return [
        ...prev.filter((item) => {
          const itemCategory = (item.category || "").trim().toLowerCase();
          return isVideoMedia(item) || itemCategory !== selectedCategory;
        }),
        normalizedUploaded,
      ];
    });

    setFile(null);
    setTitle("");
    setCategory("general");
    setCategoryComboOpen(false);
    setMessage({
      type: "success",
      text: enforceSinglePrivatePhoto
        ? "Upload successful. Previous photo in this private category was replaced."
        : "Upload successful.",
    });
  } catch (err) {
    console.error(err);
    setMessage({ type: "error", text: "Upload failed." });
  } finally {
    setLoading(false);
  }
};

  const handleReplacePrivatePhoto = async (item: Image, nextFile: File | null) => {
    if (!item.id || !nextFile) {
      return;
    }

    if (!nextFile.type.startsWith("image/")) {
      setMessage({ type: "error", text: "Only image file is allowed." });
      return;
    }

    if (nextFile.size > MAX_IMAGE_BYTES) {
      setMessage({ type: "error", text: `Image is too large. Max allowed is ${MAX_IMAGE_MB}MB.` });
      return;
    }

    const targetCategory = (item.category || "general").trim() || "general";
    const normalizedTargetCategory = targetCategory.toLowerCase();

    setReplacingPrivateId(item.id);
    try {
      const existingPrivateCategoryImages = images.filter((img) => {
        const imageCategory = (img.category || "").trim().toLowerCase();
        return img.id && !isVideoMedia(img) && imageCategory === normalizedTargetCategory;
      });

      for (const existingImage of existingPrivateCategoryImages) {
        if (existingImage.id) {
          await deleteImage(existingImage.id);
        }
      }

      const formData = new FormData();
      formData.append("file", nextFile);
      formData.append("title", (item.title || nextFile.name).trim());
      formData.append("category", targetCategory);

      const uploaded = await uploadImages(formData);
      const normalizedUploaded = {
        ...uploaded,
        url: normalizeMediaUrl(uploaded.url),
      };

      setImages((prev) => [
        ...prev.filter((img) => {
          const imageCategory = (img.category || "").trim().toLowerCase();
          return isVideoMedia(img) || imageCategory !== normalizedTargetCategory;
        }),
        normalizedUploaded,
      ]);

      setMessage({ type: "success", text: "Photo replaced successfully." });
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Failed to replace photo." });
    } finally {
      setReplacingPrivateId(null);
    }
  };

  const openAddCategoryModal = () => {
    setCategoryModalMode("add");
    setActiveCategoryId(null);
    setCategoryTitleInput("");
    setCategoryDescInput("");
    setCategoryModalOpen(true);
  };

  const openEditCategoryModal = (item: AdminCategory) => {
    setCategoryModalMode("edit");
    setActiveCategoryId(item.id);
    setCategoryTitleInput(item.label);
    setCategoryDescInput(item.desc);
    setCategoryModalOpen(true);
  };

  const closeCategoryModal = () => {
    setCategoryModalOpen(false);
    setActiveCategoryId(null);
    setCategoryTitleInput("");
    setCategoryDescInput("");
  };

  const saveCategoryModal = () => {
    const label = categoryTitleInput.trim();
    const desc = categoryDescInput.trim() || "Custom category";
    const value = slugifyCategory(label);

    if (!label || !value) {
      setMessage({ type: "error", text: "Valid category name required." });
      return;
    }

    if (categoryModalMode === "add") {
      if (categories.some((item) => item.value.toLowerCase() === value.toLowerCase())) {
        setMessage({ type: "error", text: "Category already exists." });
        return;
      }

      const next = [
        ...categories,
        {
          id: value,
          label,
          value,
          desc,
        },
      ];

      setCategories(next);
      saveAdminCategories(next);
      setMessage({ type: "success", text: "Category added." });
      closeCategoryModal();
      return;
    }

    if (!activeCategoryId) {
      setMessage({ type: "error", text: "Category not found." });
      return;
    }

    if (
      categories.some(
        (item) => item.id !== activeCategoryId && item.value.toLowerCase() === value.toLowerCase()
      )
    ) {
      setMessage({ type: "error", text: "Another category already uses this name." });
      return;
    }

    const next = categories.map((item) =>
      item.id === activeCategoryId
        ? {
            ...item,
            id: value,
            value,
            label,
            desc,
          }
        : item
    );

    setCategories(next);
    saveAdminCategories(next);
    setMessage({ type: "success", text: "Category updated." });
    closeCategoryModal();
  };

  const handleCategoryDelete = (item: AdminCategory) => {
    const next = categories.filter((category) => category.id !== item.id);
    setCategories(next);
    saveAdminCategories(next);

    if (category === item.value) {
      setCategory("general");
    }

    setMessage({ type: "success", text: "Category deleted." });
    closeCategoryModal();
  };

  const visibleCategories = showAllCategories ? categories : categories.slice(0, 4);
  const hiddenCategoryCount = Math.max(categories.length - 4, 0);
  const totalVideos = images.filter((img) => isVideoMedia(img)).length;
  const totalImages = images.length - totalVideos;
  const imageMedia = images.filter((img) => !isVideoMedia(img));
  const privateUploadImages = imageMedia.filter((img) => isPrivateUploadImage(img));
  const publicGalleryImages = imageMedia.filter((img) => !isPrivateUploadImage(img));
  const videoMedia = images.filter((img) => isVideoMedia(img));
  const homeFirstImage = images.find(
    (img) => img.category === HOME_FIRST_CATEGORY && !isVideoMedia(img)
  );
  const aboutProfileImage = images.find(
    (img) => img.category === ABOUT_PROFILE_CATEGORY && !isVideoMedia(img)
  );
  const editingMedia = editId ? images.find((img) => img.id === editId) || null : null;

  const handleReplaceHomeFirstPhoto = async () => {
    if (!homeFirstPhotoFile) {
      setMessage({ type: "error", text: "Please choose an image first." });
      return;
    }

    if (!homeFirstPhotoFile.type.startsWith("image/")) {
      setMessage({ type: "error", text: "Only image file is allowed for Home First Photo." });
      return;
    }

    if (homeFirstPhotoFile.size > MAX_IMAGE_BYTES) {
      setMessage({ type: "error", text: `Image is too large. Max allowed is ${MAX_IMAGE_MB}MB.` });
      return;
    }

    setUpdatingHomePhoto(true);
    try {
      const existingHomeImages = images.filter((img) => img.category === HOME_FIRST_CATEGORY);
      for (const existingImage of existingHomeImages) {
        if (existingImage.id) {
          await deleteImage(existingImage.id);
        }
      }

      const formData = new FormData();
      formData.append("file", homeFirstPhotoFile);
      formData.append("title", "Home First Photo");
      formData.append("category", HOME_FIRST_CATEGORY);

      const uploaded = await uploadImages(formData);
      setImages((prev) => [
        ...prev.filter((img) => img.category !== HOME_FIRST_CATEGORY),
        {
          ...uploaded,
          url: normalizeMediaUrl(uploaded.url),
        },
      ]);
      setHomeFirstPhotoFile(null);
      setMessage({ type: "success", text: "Home first photo updated." });
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Failed to update home first photo." });
    } finally {
      setUpdatingHomePhoto(false);
    }
  };

  const handleReplaceAboutPhoto = async () => {
    if (!aboutPhotoFile) {
      setMessage({ type: "error", text: "Please choose an image first." });
      return;
    }

    if (!aboutPhotoFile.type.startsWith("image/")) {
      setMessage({ type: "error", text: "Only image file is allowed for About photo." });
      return;
    }

    if (aboutPhotoFile.size > MAX_IMAGE_BYTES) {
      setMessage({ type: "error", text: `Image is too large. Max allowed is ${MAX_IMAGE_MB}MB.` });
      return;
    }

    setUpdatingAboutPhoto(true);
    try {
      const existingAboutImages = images.filter((img) => img.category === ABOUT_PROFILE_CATEGORY);
      for (const existingImage of existingAboutImages) {
        if (existingImage.id) {
          await deleteImage(existingImage.id);
        }
      }

      const formData = new FormData();
      formData.append("file", aboutPhotoFile);
      formData.append("title", "About Profile Photo");
      formData.append("category", ABOUT_PROFILE_CATEGORY);

      const uploaded = await uploadImages(formData);
      setImages((prev) => [
        ...prev.filter((img) => img.category !== ABOUT_PROFILE_CATEGORY),
        {
          ...uploaded,
          url: normalizeMediaUrl(uploaded.url),
        },
      ]);
      setAboutPhotoFile(null);
      setMessage({ type: "success", text: "About profile photo updated." });
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Failed to update about profile photo." });
    } finally {
      setUpdatingAboutPhoto(false);
    }
  };

  const handleSaveAboutContent = async () => {
    setSavingAboutContent(true);
    try {
      const saved = await updateAboutContent(aboutContent);
      setAboutContent(saved);
      setMessage({ type: "success", text: "About details updated." });
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Failed to update about details." });
    } finally {
      setSavingAboutContent(false);
    }
  };

  const handleSaveContactContent = async () => {
    setSavingContactContent(true);
    try {
      const saved = await updateContactContent(contactContent);
      setContactContent(saved);
      notifyContactContentUpdated();
      setMessage({ type: "success", text: "Contact details updated." });
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Failed to update contact details." });
    } finally {
      setSavingContactContent(false);
    }
  };

  const handleDeleteContactContent = async () => {
    setDeletingContactContent(true);
    try {
      await deleteContactContent();
      setContactContent({
        location: "",
        email: "",
        phone: "",
        instagram: "",
      });
      notifyContactContentUpdated();
      setMessage({ type: "success", text: "Contact details deleted." });
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Failed to delete contact details." });
    } finally {
      setDeletingContactContent(false);
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-container">
        <div className="admin-header">
          <div>
            <h1 className="admin-dashboard-title">Admin Dashboard</h1>
            <p className="admin-subnote">
              Logged in as <strong>{formatAdminDisplayName()}</strong>
            </p>
          </div>
          <button className="logout" onClick={logout}>
            Logout
          </button>
        </div>

        <div className="admin-intro-block">
          <p className="admin-subtitle">
            Manage your complete media library from one dashboard
          </p>
         <p className="admin-subnote">
  Please upload image or video files here and select the appropriate category to ensure proper placement. Use <strong>contact-bg</strong> or <strong>services-bg</strong> for background sections, <strong>admin-login-bg</strong> for the login panel background, and <strong>about-profile</strong> for profile media.
</p>
        </div>

        <div className="admin-image-config-sections">
          <section className="admin-panel admin-home-photo-panel">
            <h3 className="admin-panel-title">About Profile Image</h3>
            <p className="admin-subnote">This photo appears beside the “Hello, I'm {aboutContent.name || "Your Name"}” introduction in the Home/About section. Keep only one profile image here—uploading a new file will automatically replace the current one.</p>

            <div className="admin-home-photo-wrap">
              <div className="admin-home-photo-preview">
                {aboutProfileImage ? (
                  <img src={aboutProfileImage.url} alt={aboutProfileImage.title || "About profile photo"} />
                ) : (
                  <div className="admin-home-photo-empty">No about profile photo set yet.</div>
                )}
              </div>

              <div className="admin-home-photo-controls">
                <label className="file-input-wrapper">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setAboutPhotoFile(e.target.files?.[0] || null)}
                  />
                  <span className="file-button">
                    {aboutPhotoFile ? aboutPhotoFile.name : "Choose About Admin Image"}
                  </span>
                </label>

                <button
                  className="admin-home-photo-btn"
                  onClick={handleReplaceAboutPhoto}
                  disabled={updatingAboutPhoto}
                >
                  {updatingAboutPhoto ? "Updating..." : "Replace About Admin Image"}
                </button>
              </div>
            </div>

            <div className="admin-about-content-grid">
            <input
              className="admin-text-input"
              placeholder="Name"
              value={aboutContent.name}
              onChange={(e) => setAboutContent((prev) => ({ ...prev, name: e.target.value }))}
            />
            <input
              className="admin-text-input"
              placeholder="Experience"
              value={aboutContent.experience}
              onChange={(e) => setAboutContent((prev) => ({ ...prev, experience: e.target.value }))}
            />
            <input
              className="admin-text-input"
              placeholder="Projects"
              value={aboutContent.projects}
              onChange={(e) => setAboutContent((prev) => ({ ...prev, projects: e.target.value }))}
            />
            <input
              className="admin-text-input"
              placeholder="Location"
              value={aboutContent.location}
              onChange={(e) => setAboutContent((prev) => ({ ...prev, location: e.target.value }))}
            />
            <input
              className="admin-text-input"
              placeholder="Equipment"
              value={aboutContent.equipment}
              onChange={(e) => setAboutContent((prev) => ({ ...prev, equipment: e.target.value }))}
            />
            </div>

            <div className="admin-about-content-actions">
              <button
                className="admin-home-photo-btn"
                onClick={handleSaveAboutContent}
                disabled={savingAboutContent}
              >
                {savingAboutContent ? "Saving..." : "Save About Details"}
              </button>
            </div>
          </section>

          <section className="admin-panel admin-home-photo-panel">
            <h3 className="admin-panel-title">Home Hero Image</h3>
            <p className="admin-subnote">This image is displayed with the “Capturing moments that last forever” hero section on the Home page. Only one hero image is kept at a time, and uploading a new one replaces the existing image.</p>

            <div className="admin-home-photo-wrap">
              <div className="admin-home-photo-preview">
                {homeFirstImage ? (
                  <img src={homeFirstImage.url} alt={homeFirstImage.title || "Home first photo"} />
                ) : (
                  <div className="admin-home-photo-empty">No home first photo set yet.</div>
                )}
              </div>

              <div className="admin-home-photo-controls">
                <label className="file-input-wrapper">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setHomeFirstPhotoFile(e.target.files?.[0] || null)}
                  />
                  <span className="file-button">
                    {homeFirstPhotoFile ? homeFirstPhotoFile.name : "Choose Home Hero Image"}
                  </span>
                </label>

                <button
                  className="admin-home-photo-btn"
                  onClick={handleReplaceHomeFirstPhoto}
                  disabled={updatingHomePhoto}
                >
                  {updatingHomePhoto ? "Updating..." : "Replace Home Hero Image"}
                </button>
              </div>
            </div>
          </section>

        </div>

        <section className="admin-panel admin-contact-content-panel">
          <h3 className="admin-panel-title">Contact Details</h3>
          <p className="admin-subnote">These details are shown in the footer Contact section and can be edited or cleared from here.</p>

          <div className="admin-about-content-grid">
            <input
              className="admin-text-input"
              placeholder="Location"
              value={contactContent.location}
              onChange={(e) => setContactContent((prev) => ({ ...prev, location: e.target.value }))}
            />
            <input
              className="admin-text-input"
              placeholder="Email"
              value={contactContent.email}
              onChange={(e) => setContactContent((prev) => ({ ...prev, email: e.target.value }))}
            />
            <input
              className="admin-text-input"
              placeholder="Phone"
              value={contactContent.phone}
              onChange={(e) => setContactContent((prev) => ({ ...prev, phone: e.target.value }))}
            />
            <input
              className="admin-text-input"
              placeholder="Instagram Link"
              value={contactContent.instagram}
              onChange={(e) => setContactContent((prev) => ({ ...prev, instagram: e.target.value }))}
            />
          </div>

          <div className="admin-about-content-actions admin-contact-content-actions">
            <button
              className="admin-home-photo-btn"
              onClick={handleSaveContactContent}
              disabled={savingContactContent || deletingContactContent}
            >
              {savingContactContent ? "Saving..." : "Save Contact Details"}
            </button>
            <button
              className="admin-action-btn danger"
              onClick={handleDeleteContactContent}
              disabled={savingContactContent || deletingContactContent}
            >
              {deletingContactContent ? "Deleting..." : "Delete Contact Details"}
            </button>
          </div>
        </section>

        <div className="admin-stats-row">
          <div className="admin-stat-card">
            <span className="admin-stat-label">Total Media</span>
            <strong className="admin-stat-value">{images.length}</strong>
          </div>
          <div className="admin-stat-card">
            <span className="admin-stat-label">Images</span>
            <strong className="admin-stat-value">{totalImages}</strong>
          </div>
          <div className="admin-stat-card">
            <span className="admin-stat-label">Videos</span>
            <strong className="admin-stat-value">{totalVideos}</strong>
          </div>
          <div className="admin-stat-card">
            <span className="admin-stat-label">Categories</span>
            <strong className="admin-stat-value">{categories.length}</strong>
          </div>
        </div>

        {showAccessControls && (
          <section className="admin-panel admin-access-control-panel">
            <div className="admin-access-header">
              <h3 className="admin-panel-title">Admin Access Control</h3>
              <button
                type="button"
                className="admin-category-more"
                onClick={loadAccessControls}
                disabled={loadingAccessPanel}
              >
                {loadingAccessPanel ? "Refreshing..." : "Refresh"}
              </button>
            </div>

            <p className="admin-subnote">
              New users must request access first. Only approved users can login. New login automatically logs out previous device sessions.
            </p>

            <div className="admin-access-policy-row">
              <div className="admin-access-policy-item">
                <span className="admin-stat-label">Approved Users</span>
                <strong className="admin-stat-value">{accessPolicy?.approvedCount ?? 0}</strong>
              </div>
              <div className="admin-access-policy-item">
                <span className="admin-stat-label">Pending Requests</span>
                <strong className="admin-stat-value">{accessPolicy?.pendingCount ?? 0}</strong>
              </div>
              <div className="admin-access-policy-item admin-access-policy-edit">
                <span className="admin-stat-label">Max Approved Users</span>
                <div className="admin-access-policy-actions">
                  <input
                    type="number"
                    min={1}
                    className="admin-text-input"
                    value={accessPolicyInput}
                    onChange={(e) => setAccessPolicyInput(e.target.value)}
                  />
                  <button
                    type="button"
                    className="admin-action-btn"
                    onClick={handleSaveAccessPolicy}
                    disabled={savingAccessPolicy}
                  >
                    {savingAccessPolicy ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            </div>

            <div className="admin-access-request-list">
              {pendingRequests.length === 0 ? (
                <p className="admin-empty-state">No pending access requests.</p>
              ) : (
                pendingRequests.map((request) => (
                  <div key={request.email} className="admin-access-request-item">
                    <div className="admin-access-request-text">
                        <strong>{request.name?.trim() || "Unnamed User"}</strong>
                      <strong>{request.email}</strong>
                      <span>
                        Requested: {request.requestedAt ? new Date(request.requestedAt).toLocaleString() : "-"}
                      </span>
                    </div>
                    <div className="admin-card-actions">
                      <button
                        type="button"
                        className="admin-action-btn"
                        onClick={() => handleApproveRequest(request.email)}
                        disabled={processingAccessEmail === request.email}
                      >
                        {processingAccessEmail === request.email ? "Processing..." : "Approve"}
                      </button>
                      <button
                        type="button"
                        className="admin-action-btn danger"
                        onClick={() => handleRejectRequest(request.email)}
                        disabled={processingAccessEmail === request.email}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <h4 className="admin-panel-title" style={{ marginTop: "16px", marginBottom: "10px", fontSize: "16px" }}>
              Approved Users (Can Login)
            </h4>

            <div className="admin-access-request-list">
              {approvedUsers.length === 0 ? (
                <p className="admin-empty-state">No approved users found.</p>
              ) : (
                approvedUsers.map((user) => (
                  <div key={user.email} className="admin-access-request-item">
                    <div className="admin-access-request-text">
                      <strong>{user.name?.trim() || "Unnamed User"}</strong>
                      <strong>{user.email}</strong>
                      <span>
                        Approved: {user.approvedAt ? new Date(user.approvedAt).toLocaleString() : "-"}
                      </span>
                    </div>
                    <div className="admin-card-actions">
                      <button
                        type="button"
                        className="admin-action-btn danger"
                        onClick={() => handleRevokeAccess(user.email)}
                        disabled={processingAccessEmail === user.email}
                      >
                        {processingAccessEmail === user.email ? "Processing..." : "Remove Access"}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {!showAccessControls && (
          <section className="admin-panel admin-access-control-panel">
            <h3 className="admin-panel-title">Admin Access Control</h3>
            <p className="admin-subnote">
              This section is visible only for the super admin account. Login with the configured super admin email to approve requests and set user limits.
            </p>
          </section>
        )}

        <div className="admin-top-sections">
          <section className="admin-panel">
            <h3 className="admin-panel-title">Upload Media</h3>
            <p className="admin-subnote">
              Add image or video files here and assign the correct category for accurate placement. If a private/background image is deleted, upload again with the same category (for example <strong>admin-login-bg</strong>, <strong>contact-bg</strong>, <strong>services-bg</strong>, <strong>about-profile</strong>) to restore it instantly.
            </p>
            <div className="admin-upload admin-upload-grid">
              <label className="file-input-wrapper">
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={(e) => {
                    const selectedFile = e.target.files?.[0] || null;
                    setFile(selectedFile);
                    if (selectedFile && !title) {
                      setTitle(selectedFile.name);
                    }
                  }}
                />
                <span className="file-button">
                  {file ? file.name : "Choose Image"}
                </span>
              </label>
              <div className="admin-upload-fields">
                <input
                  type="text"
                  className="admin-text-input"
                  placeholder="Media title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <div className="admin-combobox" ref={categoryComboRef}>
                  <button
                    type="button"
                    className="admin-combobox-trigger"
                    onClick={() => setCategoryComboOpen((prev) => !prev)}
                    aria-expanded={categoryComboOpen}
                  >
                    <span className="admin-combobox-trigger-text">Category: {selectedCategoryLabel}</span>
                  </button>

                  {categoryComboOpen && (
                    <div className="admin-combobox-menu">
                      {categoryOptions.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className={`admin-combobox-option ${category === item.value ? "active" : ""}`}
                          onClick={() => {
                            setCategory(item.value);
                            setCategoryComboOpen(false);
                          }}
                        >
                          <span className="admin-combobox-option-label">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="admin-upload-action">
                <button onClick={handleUpload} disabled={loading}>
                  {loading ? "Uploading..." : "Upload Media"}
                </button>
              </div>
            </div>
          </section>

          <section className="admin-panel admin-category-panel">
            <div className="admin-category-header">
              <h3 className="admin-panel-title">Manage Service Categories</h3>
              <button className="admin-category-add-btn" onClick={openAddCategoryModal}>+ Add Category</button>
            </div>

            <div className="admin-category-list">
              {visibleCategories.map((item) => (
                <div className="admin-category-item" key={item.id}>
                  <div className="admin-category-row">
                    <span className="admin-section-title-text">{item.label}</span>
                    <div className="admin-card-actions">
                      <button className="admin-category-edit-btn" onClick={() => openEditCategoryModal(item)}>Edit</button>
                    </div>
                  </div>
                </div>
              ))}

              {!showAllCategories && hiddenCategoryCount > 0 && (
                <button
                  type="button"
                  className="admin-category-more"
                  onClick={() => setShowAllCategories(true)}
                >
                  +{hiddenCategoryCount}
                </button>
              )}

              {showAllCategories && hiddenCategoryCount > 0 && (
                <button
                  type="button"
                  className="admin-category-more"
                  onClick={() => setShowAllCategories(false)}
                >
                  Show less
                </button>
              )}
            </div>
          </section>
        </div>

        <section className="admin-panel">
          <h3 className="admin-panel-title">Private & Section Photos</h3>

          <p className="admin-subnote">
            Home hero, about profile, background, and admin photos are managed separately here. Each private category keeps only one photo, and uploading a new file or using “Change Photo” automatically replaces the previous one.
          </p>

          {privateUploadImages.length === 0 && <p className="admin-empty-state">No private upload photos yet.</p>}

          <div className="admin-grid">
            {privateUploadImages.map((img) => (
              <div className="admin-image-card admin-image-card-private" key={img.id}>
                <img src={img.url} alt={img.title || "uploaded"} />
                <div className="admin-image-info-row">
                  <div className="admin-image-text">
                    <span>{img.title || "Untitled"}</span>
                    <span className="admin-image-category">{img.category || "general"}</span>
                  </div>
                  <div className="admin-card-actions">
                    <label className="file-input-wrapper">
                      <input
                        type="file"
                        accept="image/*"
                        disabled={replacingPrivateId === img.id}
                        onChange={(e) => {
                          const selectedFile = e.target.files?.[0] || null;
                          handleReplacePrivatePhoto(img, selectedFile);
                          e.currentTarget.value = "";
                        }}
                      />
                      <span className="file-button">
                        {replacingPrivateId === img.id ? "Replacing..." : "Change Photo"}
                      </span>
                    </label>
                    <button className="admin-action-btn" onClick={() => startEdit(img)}>Edit</button>
                    <button className="admin-action-btn danger" onClick={() => confirmDelete(img.id)}>Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="admin-panel admin-public-gallery-panel">
          <h3 className="admin-panel-title">Public Gallery Photos</h3>
          <p className="admin-subnote">
            These images are visible on the public Gallery page. Use Edit to update labels or category.
          </p>

          {publicGalleryImages.length === 0 && <p className="admin-empty-state">No public gallery images uploaded yet.</p>}

          <div className="admin-grid">
            {publicGalleryImages.map((img) => (
              <div className="admin-image-card" key={img.id}>
                <img src={img.url} alt={img.title || "uploaded"} />
                <div className="admin-image-info-row">
                  <div className="admin-image-text">
                    <span>{img.title || "Untitled"}</span>
                    <span className="admin-image-category">{img.category || "general"}</span>
                  </div>
                  <div className="admin-card-actions">
                    <button className="admin-action-btn" onClick={() => startEdit(img)}>Edit</button>
                    <button className="admin-action-btn danger" onClick={() => confirmDelete(img.id)}>Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="admin-panel admin-uploaded-videos-panel">
          <h3 className="admin-panel-title">Video Library</h3>
          <p className="admin-subnote">
            These videos are shown on the public Videos page. Keep titles and categories clean for better presentation.
          </p>

          {videoMedia.length === 0 && <p className="admin-empty-state">No videos uploaded yet.</p>}

          <div className="admin-grid">
            {videoMedia.map((img) => (
              <div className="admin-image-card" key={img.id}>
                <video src={img.url} controls playsInline />
                <div className="admin-image-info-row">
                  <div className="admin-image-text">
                    <span>{img.title || "Untitled"}</span>
                    <span className="admin-image-category">{img.category || "general"}</span>
                  </div>
                  <div className="admin-card-actions">
                    <button className="admin-action-btn" onClick={() => startEdit(img)}>Edit</button>
                    <button className="admin-action-btn danger" onClick={() => confirmDelete(img.id)}>Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>

      {deleteTarget && (
        <div className="admin-overlay">
          <div className="admin-confirm-modal">
            <p>Are you sure you want to delete this media?</p>
            <div className="admin-card-actions">
              <button className="admin-action-btn danger" onClick={handleDelete}>Yes, Delete</button>
              <button className="admin-action-btn cancel" onClick={() => setDeleteTarget(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {categoryModalOpen && (
        <div className="admin-overlay admin-overlay-blur">
          <div className="admin-category-modal">
            <div className="admin-category-modal-header">
              <h3>{categoryModalMode === "add" ? "Add Section" : "Edit Section"}</h3>
              <p className="admin-category-modal-subtitle">
                {categoryModalMode === "add"
                  ? "Create a new service category for upload and filtering."
                  : "Update this category title or description."}
              </p>
            </div>

            <div className="admin-modal-field">
              <label className="admin-modal-label">Title</label>
              <input
                className="admin-edit-input"
                value={categoryTitleInput}
                onChange={(e) => setCategoryTitleInput(e.target.value)}
                placeholder="Enter title"
              />
            </div>

            <div className="admin-modal-field">
              <label className="admin-modal-label">Description</label>
              <textarea
                className="admin-edit-input admin-modal-textarea"
                value={categoryDescInput}
                onChange={(e) => setCategoryDescInput(e.target.value)}
                placeholder="Enter description"
              />
            </div>

            <div className="admin-card-actions admin-modal-actions">
              <button className="admin-action-btn" onClick={saveCategoryModal}>Save</button>
              {categoryModalMode === "edit" && activeCategoryId && (
                <button
                  className="admin-action-btn danger"
                  onClick={() => {
                    const current = categories.find((item) => item.id === activeCategoryId);
                    if (current) {
                      handleCategoryDelete(current);
                    }
                  }}
                >
                  Delete
                </button>
              )}
              <button className="admin-action-btn cancel" onClick={closeCategoryModal}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {editId && editingMedia && (
        <div className="admin-overlay admin-overlay-blur">
          <div className="admin-category-modal">
            <div className="admin-category-modal-header">
              <h3>Edit Media</h3>
              <p className="admin-category-modal-subtitle">
                Update the media title and category using the same quick editor.
              </p>
            </div>

            <div className="admin-modal-field">
              <label className="admin-modal-label">Title</label>
              <input
                className="admin-edit-input"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Enter media title"
              />
            </div>

            <div className="admin-modal-field">
              <label className="admin-modal-label">Category</label>
              <input
                className="admin-edit-input"
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                placeholder="Enter media category"
              />
            </div>

            <div className="admin-card-actions admin-modal-actions">
              <button className="admin-action-btn" onClick={() => handleUpdate(editingMedia)}>Save</button>
              <button className="admin-action-btn cancel" onClick={cancelEdit}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {message && (
        <div className="admin-message-center-wrap">
          <div className={`admin-message admin-message-center ${message.type}`}>{message.text}</div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
