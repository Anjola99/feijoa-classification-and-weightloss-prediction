/** Purpose: Axios API client for the Feijoa FastAPI backend. */
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

export const api = axios.create({ baseURL: API_BASE });

export const describeApiError = (error, fallback) => {
  const detail = error.response?.data?.detail;
  if (detail) return Array.isArray(detail) ? JSON.stringify(detail) : detail;
  if (error.response?.status) {
    return `${fallback} API returned ${error.response.status}.`;
  }
  if (error.request) {
    return `${fallback} Could not reach API at ${API_BASE}.`;
  }
  return `${fallback} ${error.message || ""}`.trim();
};

export const classifyImage = (formData) =>
  api.post("/predict/classify", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const predictQuality = (data) => api.post("/predict/quality", data);

export const getQualityCurve = (params) =>
  api.get("/predict/quality/curve", { params });

export const getPredictionHistory = (params) => api.get("/history", { params });
