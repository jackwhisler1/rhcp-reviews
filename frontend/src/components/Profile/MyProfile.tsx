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
      console.log(user, "user in myprofile");
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
    <div className="flex flex-col min-h-screen items-center px-4">
      <h2 className="text-xl font-bold mb-4">Settings</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label htmlFor="forName" className="block text-sm mb-2">
          Name
        </label>
        <input
          name="username"
          value={formData.username}
          onChange={handleChange}
          className="input"
          placeholder="Username"
        />
        <label htmlFor="forEmail" className="block text-sm mb-2">
          Email
        </label>
        <input
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          className="input"
          placeholder="Email"
        />{" "}
        <AvatarSelector
          selectedColor={formData.avatarColor}
          onSelect={(_, color) =>
            setFormData((prev) => ({ ...prev, avatarColor: color }))
          }
        />
        {!showChangePassword && (
          <button
            className="w-full py-3 px-4 bg-cornell-red-2 text-white-smoke  hover:bg-blood-red font-medium rounded-sm transition-colors"
            onClick={() => setShowChangePassword(true)}
          >
            Change Password
          </button>
        )}
        {showChangePassword && (
          <>
            <label
              htmlFor="forPassword"
              className="block text-sm mb-2 text-eerie-black"
            >
              Old Password
            </label>
            <input
              name="oldPassword"
              type="password"
              value={formData.oldPassword}
              onChange={handleChange}
              className="input"
            />{" "}
            <Link
              to="/forgot-password"
              className="text-sm text-blue-600 hover:underline"
            >
              Forgot password?
            </Link>
            <label
              htmlFor="forPassword"
              className="block text-sm mb-2 text-eerie-black"
            >
              New Password
            </label>
            <input
              name="newPassword"
              type="password"
              value={formData.newPassword}
              onChange={handleChange}
              className="input"
            />{" "}
            <label
              htmlFor="forPassword"
              className="block text-sm mb-2 text-eerie-black"
            >
              Confirm New Password
            </label>
            <input
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="input"
            />{" "}
          </>
        )}
        <div>
          <button type="submit" className="btn">
            Save
          </button>
        </div>
        {status === "saved" && <p className="text-green-600">Saved!</p>}
        {status === "error" && (
          <p className="text-red-600">Something went wrong.</p>
        )}
      </form>
    </div>
  );
};

export default MyProfile;
