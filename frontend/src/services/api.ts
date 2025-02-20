const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000/api";

export const fetchWrapper = async (url: string, options?: RequestInit) => {
  const response = await fetch(`${API_BASE}${url}`, options);
  if (!response.ok) throw new Error(response.statusText);
  return response.json();
};
