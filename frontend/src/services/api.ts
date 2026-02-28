import type { Image } from "../types/Image";
import type { AboutContent } from "../types/AboutContent";
import type { ContactContent } from "../types/ContactContent";

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();

const isLocalhostApiUrl = (value: string) =>
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(value);

const isClientRunningOnLocalhost =
  typeof window !== "undefined" && /^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname);

const normalizeApiBaseUrl = (value: string): string => {
  if (!value) return value;

  if (value.startsWith("/")) {
    return value.replace(/\/$/, "");
  }

  try {
    const parsed = new URL(value);
    const normalizedPath = parsed.pathname.replace(/\/$/, "");
    if (!normalizedPath || normalizedPath === "") {
      parsed.pathname = "/api";
    }
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return value.replace(/\/$/, "");
  }
};

export const API_URL =
  configuredApiUrl && !(isLocalhostApiUrl(configuredApiUrl) && !isClientRunningOnLocalhost)
    ? normalizeApiBaseUrl(configuredApiUrl)
    : "/api";

export const normalizeMediaUrl = (url: string): string => {
  if (!url) return url;

  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i.test(url)) {
    try {
      const parsed = new URL(url);
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    } catch {
      return url;
    }
  }

  return url;
};

export const testBackend = async () => {
  const res = await fetch(`${API_URL}/gallery`);
  return res.json();
};
 
// Helper: get JWT token
const getToken = () => localStorage.getItem("adminToken");

// =========================
// PUBLIC: GALLERY
// =========================
export const fetchImages = async (): Promise<Image[]> => {
  const res = await fetch(`${API_URL}/gallery`);
  if (!res.ok) throw new Error("Failed to fetch images");
  return res.json();
};

export const fetchOnlyImages = async (): Promise<Image[]> => {
  const res = await fetch(`${API_URL}/gallery/images`);
  if (!res.ok) throw new Error("Failed to fetch image media");
  return res.json();
};

export const fetchOnlyVideos = async (): Promise<Image[]> => {
  const res = await fetch(`${API_URL}/gallery/videos`);
  if (!res.ok) throw new Error("Failed to fetch video media");
  return res.json();
};

export const fetchImagesByCategory = async (category: string): Promise<Image[]> => {
  const res = await fetch(`${API_URL}/gallery/${category}`);
  if (!res.ok) throw new Error("Failed to fetch images by category");
  return res.json();
};

export const fetchCollectionMedia = async (section: string): Promise<Image[]> => {
  const res = await fetch(`${API_URL}/gallery/collections/${section}`);
  if (!res.ok) throw new Error("Failed to fetch media collection");
  return res.json();
};

export const fetchCollectionMediaByType = async (
  section: string,
  mediaKind: "image" | "video"
): Promise<Image[]> => {
  const res = await fetch(`${API_URL}/gallery/collections/${section}/${mediaKind}`);
  if (!res.ok) throw new Error("Failed to fetch media collection by type");
  return res.json();
};

// =========================
// ADMIN: PROTECTED
// =========================
export const uploadImages = async (data: FormData): Promise<Image> => {
  const token = getToken();
  if (!token) throw new Error("Unauthorized");

  const res = await fetch(`${API_URL}/gallery/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: data,
  });

  if (!res.ok) throw new Error("Upload failed");
  return res.json();
};

export const updateImage = async (id: string, imageData: Image): Promise<Image> => {
  const token = getToken();
  if (!token) throw new Error("Unauthorized");

  const res = await fetch(`${API_URL}/gallery/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(imageData),
  });

  if (!res.ok) throw new Error("Image update failed");
  return res.json();
};

export const deleteImage = async (id: string): Promise<void> => {
  const token = getToken();
  if (!token) throw new Error("Unauthorized");

  const res = await fetch(`${API_URL}/gallery/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error("Image delete failed");
};

// =========================
// AUTH: ADMIN LOGIN & PASSWORD RESET
// =========================
export const loginAdmin = async (email: string, password: string) => {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    let message = "Login failed";
    try {
      const error = await res.json();
      if (error?.message) {
        message = error.message;
      }
    } catch {
      // ignore parsing errors and keep default message
    }
    throw new Error(message);
  }

  const data = await res.json();
  if (!data?.token) {
    if (typeof data?.message === "string" && /otp/i.test(data.message)) {
      throw new Error("Backend abhi OTP mode me chal raha hai. Backend restart karke phir login karein.");
    }
    throw new Error("Token not received");
  }
  localStorage.setItem("adminToken", data.token);
  return data;
};

export const verifyLoginOtp = async (email: string, otp: string) => {
  const res = await fetch(`${API_URL}/auth/verify-login-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp }),
  });
  if (!res.ok) {
    let message = "OTP verification failed";
    try {
      const error = await res.json();
      if (error?.message) {
        message = error.message;
      }
    } catch {
      // keep default message
    }
    throw new Error(message);
  }

  const data = await res.json();
  if (!data?.token) {
    throw new Error("Token not received after OTP verification");
  }
  localStorage.setItem("adminToken", data.token);
  return data.token;
};

export const registerAdmin = async (name: string, email: string) => {
  const res = await fetch(`${API_URL}/auth/send-registration-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email }),
  });
  if (!res.ok) {
    let message = "Registration failed";
    try {
      const error = await res.json();
      if (error?.message) {
        message = error.message;
      }
    } catch {
      // keep default message
    }
    throw new Error(message);
  }
  return res.json();
};

export const requestAdminAccess = async (name: string, email: string) => {
  const res = await fetch(`${API_URL}/auth/request-access`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email }),
  });
  if (!res.ok) {
    let message = "Failed to submit access request";
    try {
      const error = await res.json();
      if (error?.message) {
        message = error.message;
      }
    } catch {
      // keep default message
    }
    throw new Error(message);
  }
  return res.json();
};

export const requestAdminAccessExisting = async (email: string, password: string) => {
  const res = await fetch(`${API_URL}/auth/request-access-existing`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    let message = "Failed to submit access request";
    try {
      const error = await res.json();
      if (error?.message) {
        message = error.message;
      }
    } catch {
      // keep default message
    }
    throw new Error(message);
  }

  return res.json();
};

export const sendRegistrationOtp = async (name: string, email: string) => {
  const res = await fetch(`${API_URL}/auth/send-registration-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email }),
  });
  if (!res.ok) {
    let message = "Failed to send OTP";
    try {
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const error = await res.json();
        if (error?.message) {
          message = error.message;
        } else if (error?.errors && typeof error.errors === "object") {
          const firstValidationMessage = Object.values(error.errors)[0];
          if (typeof firstValidationMessage === "string" && firstValidationMessage.trim()) {
            message = firstValidationMessage;
          }
        }
      } else {
        const raw = (await res.text()).trim();
        if (raw) {
          message = raw;
        }
      }
    } catch {
      // keep default message
    }
    throw new Error(message);
  }
  return res.json();
};

export const verifyRegistrationOtp = async (email: string, otp: string) => {
  const res = await fetch(`${API_URL}/auth/verify-registration-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp }),
  });
  if (!res.ok) {
    let message = "OTP verification failed";
    try {
      const error = await res.json();
      if (error?.message) {
        message = error.message;
      }
    } catch {
      // keep default message
    }
    throw new Error(message);
  }
  return res.json();
};

export const setRegistrationPassword = async (email: string, password: string) => {
  const res = await fetch(`${API_URL}/auth/set-registration-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    let message = "Failed to set password";
    try {
      const error = await res.json();
      if (error?.message) {
        message = error.message;
      }
    } catch {
      // keep default message
    }
    throw new Error(message);
  }

  return res.json();
};

export const requestAdminAccessLegacy = async (name: string, email: string, password: string) => {
  const res = await fetch(`${API_URL}/auth/request-access`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  if (!res.ok) {
    let message = "Failed to submit access request";
    try {
      const error = await res.json();
      if (error?.message) {
        message = error.message;
      }
    } catch {
      // keep default message
    }
    throw new Error(message);
  }
  return res.json();
};

const getAdminAuthHeaders = () => {
  const token = getToken();
  if (!token) throw new Error("Unauthorized");

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

export type AccessPolicy = {
  maxApprovedAdmins: number;
  approvedCount: number;
  pendingCount: number;
};

export type PendingAccessRequest = {
  name?: string;
  email: string;
  requestedAt?: string;
  status: string;
};

export type ApprovedAccessUser = {
  name?: string;
  email: string;
  approvedAt?: string;
  role?: string;
};

export const fetchAccessPolicy = async (): Promise<AccessPolicy> => {
  const res = await fetch(`${API_URL}/admin/access/policy`, {
    headers: getAdminAuthHeaders(),
  });

  if (!res.ok) {
    let message = "Failed to fetch access policy";
    try {
      const error = await res.json();
      if (error?.message) {
        message = error.message;
      }
    } catch {
      // keep default message
    }
    throw new Error(message);
  }

  return res.json();
};

export const updateAccessPolicy = async (maxApprovedAdmins: number): Promise<AccessPolicy> => {
  const res = await fetch(`${API_URL}/admin/access/policy`, {
    method: "PUT",
    headers: getAdminAuthHeaders(),
    body: JSON.stringify({ maxApprovedAdmins }),
  });

  if (!res.ok) {
    let message = "Failed to update access policy";
    try {
      const error = await res.json();
      if (error?.message) {
        message = error.message;
      }
    } catch {
      // keep default message
    }
    throw new Error(message);
  }

  return res.json();
};

export const fetchPendingAccessRequests = async (): Promise<PendingAccessRequest[]> => {
  const res = await fetch(`${API_URL}/admin/access/pending`, {
    headers: getAdminAuthHeaders(),
  });

  if (!res.ok) {
    let message = "Failed to fetch pending access requests";
    try {
      const error = await res.json();
      if (error?.message) {
        message = error.message;
      }
    } catch {
      // keep default message
    }
    throw new Error(message);
  }

  return res.json();
};

export const fetchApprovedAccessUsers = async (): Promise<ApprovedAccessUser[]> => {
  const res = await fetch(`${API_URL}/admin/access/approved`, {
    headers: getAdminAuthHeaders(),
  });

  if (!res.ok) {
    let message = "Failed to fetch approved users";
    try {
      const error = await res.json();
      if (error?.message) {
        message = error.message;
      }
    } catch {
      // keep default message
    }
    throw new Error(message);
  }

  return res.json();
};

export const approveAccessRequest = async (email: string): Promise<void> => {
  const res = await fetch(`${API_URL}/admin/access/approve`, {
    method: "POST",
    headers: getAdminAuthHeaders(),
    body: JSON.stringify({ email }),
  });

  if (!res.ok) {
    let message = "Failed to approve access request";
    try {
      const error = await res.json();
      if (error?.message) {
        message = error.message;
      }
    } catch {
      // keep default message
    }
    throw new Error(message);
  }
};

export const rejectAccessRequest = async (email: string): Promise<void> => {
  const res = await fetch(`${API_URL}/admin/access/reject`, {
    method: "POST",
    headers: getAdminAuthHeaders(),
    body: JSON.stringify({ email }),
  });

  if (!res.ok) {
    let message = "Failed to reject access request";
    try {
      const error = await res.json();
      if (error?.message) {
        message = error.message;
      }
    } catch {
      // keep default message
    }
    throw new Error(message);
  }
};

export const revokeAccessUser = async (email: string): Promise<void> => {
  const res = await fetch(`${API_URL}/admin/access/revoke`, {
    method: "POST",
    headers: getAdminAuthHeaders(),
    body: JSON.stringify({ email }),
  });

  if (!res.ok) {
    let message = "Failed to revoke user access";
    try {
      const error = await res.json();
      if (error?.message) {
        message = error.message;
      }
    } catch {
      // keep default message
    }
    throw new Error(message);
  }
};

export const checkAdminSession = async (): Promise<void> => {
  const token = getToken();
  if (!token) {
    throw new Error("Unauthorized");
  }

  const res = await fetch(`${API_URL}/auth/validate`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 401 || res.status === 403) {
    throw new Error("Session expired");
  }

  if (!res.ok) {
    throw new Error("Failed to validate session");
  }
};

export type CurrentAdminProfile = {
  name?: string;
  email: string;
  role?: string;
  approved?: boolean;
};

export const fetchCurrentAdminProfile = async (): Promise<CurrentAdminProfile> => {
  const res = await fetch(`${API_URL}/auth/me`, {
    method: "GET",
    headers: getAdminAuthHeaders(),
  });

  if (!res.ok) {
    let message = "Failed to fetch current admin profile";
    try {
      const error = await res.json();
      if (error?.message) {
        message = error.message;
      }
    } catch {
      // keep default message
    }
    throw new Error(message);
  }

  return res.json();
};

export const sendResetLink = async (email: string): Promise<void> => {
  const res = await fetch(`${API_URL}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw new Error("Failed to send reset link");
};

export const sendResetOtp = async (email: string): Promise<void> => {
  const res = await fetch(`${API_URL}/auth/forgot-password-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw new Error("Failed to send reset OTP");
};

export const resetPassword = async (token: string, newPassword: string): Promise<void> => {
  const res = await fetch(`${API_URL}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, newPassword }),
  });
  if (!res.ok) throw new Error("Failed to reset password");
};

export const resetPasswordWithOtp = async (
  email: string,
  otp: string,
  newPassword: string
): Promise<void> => {
  const res = await fetch(`${API_URL}/auth/reset-password-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp, newPassword }),
  });
  if (!res.ok) throw new Error("Failed to reset password with OTP");
};

export const logoutAdmin = () => {
  localStorage.removeItem("adminToken");
}

export const sendContactQuery = async (name: string, email: string, message: string) => {
  const res = await fetch(`${API_URL}/contact/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, message }),
  });

  if (!res.ok) {
    let errorMessage = "Failed to send query";
    try {
      const error = await res.json();
      if (error?.message) {
        errorMessage = error.message;
      }
    } catch {
      // keep default message
    }
    throw new Error(errorMessage);
  }

  return res.json();
};

export const fetchAboutContent = async (): Promise<AboutContent> => {
  const res = await fetch(`${API_URL}/content/about`);
  if (!res.ok) throw new Error("Failed to fetch about content");
  return res.json();
};

export const updateAboutContent = async (payload: AboutContent): Promise<AboutContent> => {
  const token = getToken();
  if (!token) throw new Error("Unauthorized");

  const res = await fetch(`${API_URL}/content/about`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let message = "Failed to update about content";
    try {
      const error = await res.json();
      if (error?.message) {
        message = error.message;
      }
    } catch {
      // keep default message
    }
    throw new Error(message);
  }

  return res.json();
};

export const fetchContactContent = async (): Promise<ContactContent> => {
  const res = await fetch(`${API_URL}/content/contact`);
  if (!res.ok) throw new Error("Failed to fetch contact content");
  return res.json();
};

export const updateContactContent = async (payload: ContactContent): Promise<ContactContent> => {
  const token = getToken();
  if (!token) throw new Error("Unauthorized");

  const res = await fetch(`${API_URL}/content/contact`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let message = "Failed to update contact content";
    try {
      const error = await res.json();
      if (error?.message) {
        message = error.message;
      }
    } catch {
      // keep default message
    }
    throw new Error(message);
  }

  return res.json();
};

export const deleteContactContent = async (): Promise<void> => {
  const token = getToken();
  if (!token) throw new Error("Unauthorized");

  const res = await fetch(`${API_URL}/content/contact`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    let message = "Failed to delete contact content";
    try {
      const error = await res.json();
      if (error?.message) {
        message = error.message;
      }
    } catch {
      // keep default message
    }
    throw new Error(message);
  }
};


