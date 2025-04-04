import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthForm from "../components/common/AuthForm";
import { login } from "../services/authService";
import { RegistrationError } from "../types/auth-types";
import { useAuth } from "../context/AuthContext";

const LoginPage: React.FC = () => {
  const [errors, setErrors] = useState<RegistrationError>({});
  const navigate = useNavigate();
  const { login: setAuthUser } = useAuth(); // Get the login function from context

  const handleLogin = async (formData: { email: string; password: string }) => {
    try {
      console.log("Login attempt with:", formData.email);
      const response = await login(formData.email, formData.password);

      console.log("Login successful, API response:", response.data);

      // Debug - check what we're passing to setAuthUser
      console.log("Setting auth user with data:", {
        user: response.data.user,
        token: response.data.token ? "token exists" : "no token",
        refreshToken: response.data.refreshToken
          ? "refresh token exists"
          : "no refresh token",
      });

      // Use the auth context to update the user state immediately
      setAuthUser(response.data);

      // Debug - log auth state after setting
      console.log("Auth user set, navigating to home page");

      navigate("/");
    } catch (err: any) {
      console.error("Login error:", err);
      if (err.response?.data?.error) {
        setErrors({ general: [err.response.data.error] });
      } else {
        setErrors({ general: ["Login failed. Please try again."] });
      }
    }
  };

  return <AuthForm onSubmit={handleLogin} isLogin errors={errors} />;
};

export default LoginPage;
