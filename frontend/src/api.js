import axios from "axios";

// Base API configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8001",
  headers: {
    "Content-Type": "application/json",
  },
});

let authToken = null;

// Allow context to update token dynamically in memory
export const setAuthToken = (token) => {
  authToken = token;
};

// Request Interceptor: Attach JWT Token to outgoing requests
api.interceptors.request.use(
  (config) => {
    const activeToken = authToken || localStorage.getItem("savomart_token");
    if (activeToken) {
      config.headers.Authorization = `Bearer ${activeToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Catch 401 Unauthorized errors and force login redirect
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear cache and session
      localStorage.removeItem("savomart_token");
      localStorage.removeItem("savomart_user");
      setAuthToken(null);

      // Avoid infinite loop if user is already on Login screen
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// --- API Endpoint Handlers ---

export const requestOTP = async (phoneNumber) => {
  const response = await api.post("/api/auth/request-otp", { phone_number: phoneNumber });
  return response.data;
};

export const verifyOTP = async (phoneNumber, otp) => {
  const response = await api.post("/api/auth/verify-otp", {
    phone_number: phoneNumber,
    otp_code: otp,
  });
  return response.data; // contains access_token, token_type, user
};

export const getMe = async () => {
  const response = await api.get("/api/users/me");
  return response.data;
};

export const getCoupons = async () => {
  const response = await api.get("/api/users/me/coupons");
  return response.data;
};

export const getPointsHistory = async (limit = 10) => {
  const response = await api.get("/api/users/me/points-history", { params: { limit } });
  return response.data;
};

export const getStats = async () => {
  const response = await api.get("/api/users/me/stats");
  return response.data;
};

export const getOffers = async (storeId = null, category = null, activeOnly = true) => {
  const params = { active_only: activeOnly };
  if (storeId) params.store_id = storeId;
  if (category && category !== "All") params.category = category;
  const response = await api.get("/api/offers", { params });
  return response.data;
};

export const getOfferCategories = async () => {
  const response = await api.get("/api/offers/categories");
  return response.data;
};

export const getOffer = async (offerId) => {
  const response = await api.get(`/api/offers/${offerId}`);
  return response.data;
};

export const updateProfile = async (profileData) => {
  const response = await api.put("/api/users/me", profileData);
  return response.data;
};

export const getStores = async (lat = null, lng = null) => {
  const params = {};
  if (lat !== null && lng !== null) {
    params.lat = lat;
    params.lng = lng;
  }
  const response = await api.get("/api/stores", { params });
  return response.data;
};

export const getNearestStores = async (lat, lng) => {
  const response = await api.get("/api/stores/nearest", { params: { lat, lng } });
  return response.data; // returns array of top 3 nearest stores
};

export const submitSupportRequest = async (supportData) => {
  const response = await api.post("/api/support", supportData);
  return response.data;
};

export const getMySupportTickets = async () => {
  const response = await api.get("/api/support/my-tickets");
  return response.data;
};

export const getSupportContact = async () => {
  const response = await api.get("/api/support/contact");
  return response.data;
};

export const sendChatMessage = async (message, sessionId, history = []) => {
  const response = await api.post("/api/support/chat", {
    message,
    session_id: sessionId,
    history,
  });
  return response.data;
};

export default api;
