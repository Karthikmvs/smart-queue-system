const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  try {
    const hostname = window.location.hostname;
    if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return '/_/backend/api';
    }
  } catch (e) {
    // Fallback if window is not defined
  }
  return 'http://localhost:5000/api';
};

const API_BASE_URL = getApiBaseUrl();

const getHeaders = () => {
  const token = localStorage.getItem('token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const apiRequest = async (endpoint: string, method: string = 'GET', body?: any) => {
  try {
    const config: RequestInit = {
      method,
      headers: getHeaders(),
    };
    if (body) {
      config.body = JSON.stringify(body);
    }
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }
    return data;
  } catch (error) {
    console.error(`API Error in ${endpoint}:`, error);
    throw error;
  }
};
