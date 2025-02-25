import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthForm from "../components/common/AuthForm";
import { login, storeAuthData } from "../services/authService";
import { RegistrationError } from "../types/auth-types";

const LoginPage: React.FC = () => {
  const [errors, setErrors] = useState<RegistrationError>({});
  const navigate = useNavigate();

  const handleLogin = async (formData: { email: string; password: string }) => {
    try {
      const response = await login(formData.email, formData.password);
      storeAuthData(response.data);
      navigate("/");
    } catch (err: any) {
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
