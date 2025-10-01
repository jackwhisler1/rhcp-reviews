import React, { useState, useEffect } from "react";
import { getCurrentUser, updateUser } from "../../services/authService";
import AvatarSelector from "./AvatarSelector";
import { Link } from "react-router-dom";

const MyProfile = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    image: "",
    avatarColor: "",
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle"
  );
  const [showChangePassword, setShowChangePassword] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const user = await getCurrentUser();
      if (user) {
        setFormData({
          username: user.username || "",
          email: user.email || "",
          image: user.image || "",
          avatarColor: user.avatarColor,
          oldPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      }
    };
    fetchUser();
  }, []);

  // Auto-dismiss save/error messages
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (status === "saved" || status === "error") {
      timeoutId = setTimeout(() => {
        setStatus("idle");
      }, 3000); // 3 seconds
    }

    // Cleanup function to clear timeout
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [status]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("saving");

    if (
      showChangePassword &&
      formData.newPassword !== formData.confirmPassword
    ) {
      setStatus("error");
      return;
    }

    try {
      const payload: any = {
        username: formData.username,
        email: formData.email,
        avatarColor: formData.avatarColor,
      };

      if (showChangePassword) {
        payload.password = formData.oldPassword;
        payload.newPassword = formData.newPassword;
      }

      await updateUser(payload);
      setStatus("saved");
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md p-6 bg-white-smoke rounded-md shadow-lg">
        <h2 className="mb-4 text-night text-lg font-semibold text-center">
          Profile Settings
        </h2>

        {/* Status Messages */}
        {status === "saved" && (
          <div className="mb-4 text-green-600 text-center">
            Profile updated successfully!
          </div>
        )}
        {status === "error" && (
          <div className="mb-4 text-imperial-red text-center">
            {showChangePassword &&
            formData.newPassword !== formData.confirmPassword
              ? "Passwords do not match"
              : "Something went wrong. Please try again."}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username Input */}
          <div>
            <label htmlFor="username" className="block text-sm mb-2">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              className="py-3 px-4 block w-full border border-silver rounded-sm text-sm focus:border-cornell-red focus:ring-0"
              required
            />
          </div>

          {/* Email Input */}
          <div>
            <label htmlFor="email" className="block text-sm mb-2">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className="py-3 px-4 block w-full border border-silver rounded-sm text-sm focus:border-cornell-red focus:ring-0"
              required
            />
          </div>

          {/* Avatar Selector */}
          <div>
            <label className="block text-sm mb-2">Avatar</label>
            <AvatarSelector
              selectedColor={formData.avatarColor}
              onSelect={(_, color) =>
                setFormData((prev) => ({ ...prev, avatarColor: color }))
              }
            />
          </div>

          {/* Change Password Toggle */}
          {!showChangePassword && (
            <button
              type="button"
              onClick={() => setShowChangePassword(true)}
              className="w-full py-3 px-4 bg-gray-200 text-gray-800 hover:bg-gray-300 font-medium rounded-sm transition-colors"
            >
              Change Password
            </button>
          )}

          {/* Password Change Section */}
          {showChangePassword && (
            <>
              <div>
                <label htmlFor="oldPassword" className="block text-sm mb-2">
                  Current Password
                </label>
                <input
                  id="oldPassword"
                  name="oldPassword"
                  type="password"
                  value={formData.oldPassword}
                  onChange={handleChange}
                  className="py-3 px-4 block w-full border border-silver rounded-sm text-sm focus:border-cornell-red focus:ring-0"
                  required
                />
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm mb-2">
                  New Password
                </label>
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  value={formData.newPassword}
                  onChange={handleChange}
                  className="py-3 px-4 block w-full border border-silver rounded-sm text-sm focus:border-cornell-red focus:ring-0"
                  required
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm mb-2">
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="py-3 px-4 block w-full border border-silver rounded-sm text-sm focus:border-cornell-red focus:ring-0"
                  required
                />
              </div>

              <Link
                to="/forgot-password"
                className="text-xs hover:text-blood-red block text-right"
              >
                Forgot password?
              </Link>
            </>
          )}

          {/* Action Buttons */}
          <div className="grid my-6">
            <button
              type="submit"
              disabled={status === "saving"}
              className="w-full py-3 px-4 bg-cornell-red-2 text-white-smoke hover:bg-blood-red font-medium rounded-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === "saving" ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MyProfile;
