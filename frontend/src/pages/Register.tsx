import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { register } from "../services/authService";
import { AuthFormData, RegistrationError } from "../types/auth-types";
import AuthForm from "../components/common/AuthForm";

const RegisterPage: React.FC = () => {
  const [errors, setErrors] = useState<RegistrationError>();
  const navigate = useNavigate();

  const handleRegister = async (formData: AuthFormData) => {
    try {
      if (!formData.username) {
        throw new Error("Username is required");
      }

      await register({
        email: formData.email,
        username: formData.username,
        password: formData.password,
      });
      navigate("/login");
    } catch (err: any) {
      setErrors(err.response?.data?.error || "Registration failed");
    }
  };

  return <AuthForm onSubmit={handleRegister} errors={errors} />;
};
export default RegisterPage;
