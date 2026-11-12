import axios from "axios";

// L-port dyal Spring Boot (t9der tbdlo b NEXT_PUBLIC_API_URL)
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4333/api/v1";

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

export const getToken = () => (typeof window !== "undefined" ? localStorage.getItem("token") : null);

export const logout = () => {
  localStorage.removeItem("token");
  // Reload kaml (machi router) bach ytmse7 ga3 l-state dyal l-user
  window.location.assign(new URL("/auth", window.location.origin).href);
};

// 9bel ay request: zid token ila kayn
apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/** Endpoints publics (Coran): 401 hna ma-3endo 7ta 3ala9a b l-compte -> ma ndirouch logout */
const isPublic = (url?: string) => !!url && /^\/?(quran|auth)\//.test(url.replace(/^https?:\/\/[^/]+\/api\/v1/, ""));

// Token expira -> rje3 l /auth (ghir ila kan token w l-endpoint protégé)
apiClient.interceptors.response.use(
  (r) => r,
  (error) => {
    if (
      typeof window !== "undefined" &&
      error?.response?.status === 401 &&
      getToken() &&
      !isPublic(error?.config?.url) &&
      !window.location.pathname.startsWith("/auth")
    ) {
      logout();
    }
    return Promise.reject(error);
  },
);