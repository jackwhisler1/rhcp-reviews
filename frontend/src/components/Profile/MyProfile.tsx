import React, { useState, useEffect } from "react";
import { getCurrentUser, updateUser } from "../../services/authService";
import AvatarSelector from "./AvatarSelector";

const MyProfile = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    image: "",
    avatarColor: "",
    password: "",
  });
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle"
  );

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
          password: "", // don’t pre-fill
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
    try {
      const { password, ...updateData } = formData;
      const payload = password ? { ...updateData, password } : updateData;
      await updateUser(payload);
      setStatus("saved");
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-10">
      <h2 className="text-xl font-bold mb-4">My Profile</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="username"
          value={formData.username}
          onChange={handleChange}
          className="input"
          placeholder="Username"
        />
        <input
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="input"
          placeholder="Email"
        />

        <AvatarSelector
          selectedColor={formData.avatarColor}
          onSelect={(_, color) =>
            setFormData((prev) => ({ ...prev, avatarColor: color }))
          }
        />

        <input
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          className="input"
          placeholder="New password (optional)"
        />
        <button type="submit" className="btn">
          Save
        </button>
        {status === "saved" && <p className="text-green-600">Saved!</p>}
        {status === "error" && (
          <p className="text-red-600">Something went wrong.</p>
        )}
      </form>
    </div>
  );
};

export default MyProfile;
