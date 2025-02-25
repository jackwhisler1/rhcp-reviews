import axios from "axios";

const API_URL = "http://localhost:5000/api/auth";

interface RegisterData {
  email: string;
  username: string;
  password: string;
}

export const register = async (data: RegisterData) => {
  return axios.post(`${API_URL}/register`, data);
};

export const login = async (email: string, password: string) => {
  return axios.post(`${API_URL}/login`, { email, password });
};

// Add to localStorage helpers
export const storeAuthData = (userData: any) => {
  localStorage.setItem(
    "user",
    JSON.stringify({
      id: userData.user.id,
      email: userData.user.email,
      username: userData.user.username,
      token: userData.token,
    })
  );
};

export const getCurrentUser = () => {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};
