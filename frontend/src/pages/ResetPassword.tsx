import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword } from "../services/authService";
import { RegistrationError } from "../types/auth-types";
import { ReactComponent as Logo } from "../assets/rht-logo.svg";

const ResetPasswordPage: React.FC = () => {
  const [errors, setErrors] = useState<RegistrationError>({});
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      setErrors({ general: ["Invalid or missing reset token"] });
      return;
    }

    try {
      await resetPassword(token, password);
      navigate("/login");
    } catch (err: any) {
      console.error("Reset password error:", err);
      if (err.response?.data?.error) {
        setErrors({ general: [err.response.data.error] });
      } else {
        setErrors({ general: ["Password reset failed. Try again."] });
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-night items-center justify-center px-4">
      <div className="w-full max-w-md p-6 bg-white-smoke rounded-md shadow-lg">
        <a href="/" className="py-4 flex justify-center">
          <Logo width={600} height={320} className="mx-auto fill-current" />
        </a>
        <h2 className="mb-4 text-night text-lg font-semibold text-center">
          Reset Password
        </h2>

        {errors?.general && (
          <div className="mb-4 text-imperial-red text-sm text-center">
            {errors.general.map((error, index) => (
              <div key={index}>{error}</div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="newPassword" className="block text-sm mb-2">
              New Password
            </label>
            <input
              type="password"
              id="newPassword"
              className="py-3 px-4 block w-full border border-silver rounded-sm text-sm focus:border-cornell-red focus:ring-0"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="grid my-6">
            <button
              type="submit"
              className="w-full py-3 px-4 bg-cornell-red-2 text-white-smoke hover:bg-blood-red font-medium rounded-sm transition-colors"
            >
              Reset Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
