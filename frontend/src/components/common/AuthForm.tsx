import React, { useState } from "react";
import { AuthFormData, AuthFormProps } from "../../types/auth-types";

const AuthForm: React.FC<AuthFormProps> = ({
  onSubmit,
  isLogin = false,
  errors,
}) => {
  const [formData, setFormData] = useState<AuthFormData>({
    email: "",
    username: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Ensure username is present for registration
    if (!isLogin && !formData.username) {
      alert("Username is required");
      return;
    }

    await onSubmit(formData);
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-red-700 mb-6">
        {isLogin ? "Login" : "Register"}
      </h2>
      {errors && (
        <div className="mb-4 text-red-600">
          {errors?.general?.map((error, index) => (
            <div key={index} className="mb-4 text-red-600">
              {error}
            </div>
          ))}
        </div>
      )}{" "}
      {/* Show field-specific errors */}
      {!isLogin &&
        errors?.username?.map((error, index) => (
          <div key={index} className="mb-4 text-red-600">
            {error}
          </div>
        ))}
      <form onSubmit={handleSubmit}>
        {/* Email Field */}
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Email</label>
          <input
            type="email"
            className="w-full p-2 border rounded"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            required
          />
        </div>

        {/* Username Field (only for registration) */}
        {!isLogin && (
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Username</label>
            <input
              type="text"
              className="w-full p-2 border rounded"
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              required
            />
          </div>
        )}

        {/* Password Field */}
        <div className="mb-6">
          <label className="block text-gray-700 mb-2">Password</label>
          <input
            type="password"
            className="w-full p-2 border rounded"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-red-700 text-white py-2 px-4 rounded hover:bg-red-800 transition-colors"
        >
          {isLogin ? "Sign In" : "Create Account"}
        </button>
      </form>
    </div>
  );
};
export default AuthForm;
