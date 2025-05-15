import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

// Axios 인스턴스
export const instance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});
