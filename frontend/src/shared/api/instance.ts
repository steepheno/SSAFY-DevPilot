import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;
const FAST_API_URL = import.meta.env.VITE_FAST_API_URL;

// Axios 인스턴스
export const instance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// FastAPI 인스턴스
export const fastApiInstance = axios.create({
  baseURL: FAST_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const initialSettingsInstance = axios.create({
  baseURL: API_URL,
  timeout: 10 * 60 * 1000, // 10분
});
