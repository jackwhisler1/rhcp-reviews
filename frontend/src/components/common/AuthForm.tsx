import React, { useState } from "react";
import { AuthFormData, AuthFormProps } from "../../types/auth-types";
import { ReactComponent as Logo } from "../../assets/rht-logo.svg";

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

    if (!isLogin && !formData.username) {
      alert("Username is required");
      return;
    }

    await onSubmit(formData);
  };

  return (
    <div className="flex flex-col min-h-screen bg-night items-center justify-center px-4">
      <div className="w-full max-w-md p-6 bg-white-smoke rounded-md shadow-lg">
        <a href="/" className="py-4 flex justify-center">
          <Logo
            width={600}
            height={320}
            className="mx-auto fill-current justify-center"
          />
        </a>
        <h2 className="mb-4 text-night text-lg font-semibold text-center">
          {isLogin ? "Login" : "Register"}
        </h2>

        {/* Display errors if any */}
        {errors?.general && (
          <div className="mb-4 text-imperial-red text-sm text-center">
            {errors.general.map((error, index) => (
              <div key={index}>{error}</div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Username Field */}
          {!isLogin && (
            <div className="mb-4">
              <label htmlFor="forName" className="block text-sm mb-2">
                Name
              </label>
              <input
                type="text"
                id="forName"
                className="py-3 px-4 block w-full border border-silver rounded-sm text-sm focus:border-cornell-red focus:ring-0"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                required
              />
              {errors?.username && (
                <div className="text-sm mt-1">
                  {errors.username.map((error, index) => (
                    <div key={index}>{error}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Email Field */}
          <div className="mb-4">
            <label htmlFor="forEmail" className="block text-sm mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="forEmail"
              className="py-3 px-4 block w-full border rounded-sm text-sm focus:border-cornell-red focus:ring-0"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
            />
            {errors?.email && (
              <div className="text-sm mt-1">
                {errors.email.map((error, index) => (
                  <div key={index}>{error}</div>
                ))}
              </div>
            )}
          </div>

          {/* Password Field */}
          <div className="mb-4">
            <label
              htmlFor="forPassword"
              className="block text-sm mb-2 text-eerie-black"
            >
              Password
            </label>
            <input
              type="password"
              id="forPassword"
              className="py-3 px-4 block w-full border border-silver rounded-sm text-sm focus:border-cornell-red focus:ring-0"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
            />
            {errors?.password && (
              <div className="text-imperial-red text-sm mt-1">
                {errors.password.map((error, index) => (
                  <div key={index}>{error}</div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="grid my-6">
            <button
              type="submit"
              className="w-full py-3 px-4 bg-cornell-red-2 text-white-smoke  hover:bg-blood-red font-medium rounded-sm transition-colors"
            >
              {isLogin ? "Sign In" : "Sign Up"}
            </button>
          </div>

          {/* Sign In / Sign Up Link */}
          <div className="flex justify-center gap-2 items-center">
            <p className="text-base font-semibold text-silver">
              {isLogin ? "Don't have an Account?" : "Already have an Account?"}
            </p>
            <a
              href={isLogin ? "/register" : "/login"}
              className="text-sm font-semibold hover:text-blood-red"
            >
              {isLogin ? "Sign Up" : "Sign In"}
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthForm;
