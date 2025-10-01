# App.tsx

```tsx
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Home from "./pages/Home";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LoginPage from "./pages/Login";
import RegisterPage from "./pages/Register";
import GroupsPage from "./pages/Groups";
import GroupDetailPage from "./pages/GroupDetail";
import CreateGroupPage from "./pages/CreateGroup";
import { ReactNode } from "react";
import MyProfilePage from "./pages/MyProfile";
import ForgotPasswordPage from "./pages/ForgotPassword";
import ResetPasswordPage from "./pages/ResetPassword";

// Fixed ProtectedRoute component with proper TypeScript types
interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();

  // Show loading indicator while checking auth
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" />;
  }

  // Render children if authenticated
  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<Home />} />
          <Route path="/me" element={<MyProfilePage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Group routes */}
          <Route
            path="/groups"
            element={
              <ProtectedRoute>
                <GroupsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/groups/create"
            element={
              <ProtectedRoute>
                <CreateGroupPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/groups/:groupId"
            element={
              <ProtectedRoute>
                <GroupDetailPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;

```

# assets\pepper-avatar.svg

This is a file of the type: SVG Image

# assets\rht-logo.svg

This is a file of the type: SVG Image

# components\AlbumCarousel\AlbumCarousel.tsx

```tsx
import React, { useEffect, useState } from "react";
import { Album } from "../../types/rhcp-types";

interface AlbumCarouselProps {
  onAlbumSelect: (album: { id: number; title: string }) => void;
  selectedAlbumId: number | null;
  layout?: "horizontal" | "vertical" | "auto";
}

const AlbumCarousel: React.FC<AlbumCarouselProps> = ({
  onAlbumSelect,
  selectedAlbumId,
  layout = "auto",
}) => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  // Fetch albums
  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/albums");
        const data = await response.json();
        setAlbums(data.data);
      } catch (error) {
        console.error("Error fetching albums:", error);
      }
    };
    fetchAlbums();
  }, []);

  // Check screen size
  useEffect(() => {
    const handleResize = () => {
      setIsLargeScreen(window.innerWidth >= 1024); // lg breakpoint
    };

    // Initial check
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Determine actual layout
  const actualLayout =
    layout === "auto" ? (isLargeScreen ? "vertical" : "horizontal") : layout;

  // Modified class for vertical layout to match chart height
  const verticalContainerClass =
    "flex flex-col gap-2 h-[600px] overflow-y-auto pr-2 custom-scrollbar";

  const horizontalContainerClass = "flex gap-4 overflow-x-auto pb-4";

  return (
    <div className={`select-none ${actualLayout === "vertical" ? "" : "mb-4"}`}>
      <h2 className="text-lg font-bold mb-3">RHCP Albums</h2>

      <div
        className={
          actualLayout === "vertical"
            ? verticalContainerClass
            : horizontalContainerClass
        }
      >
        {albums?.map((album) => (
          <div
            key={album.id}
            className={`
              cursor-pointer transition-all 
              ${
                selectedAlbumId === album.id
                  ? "border-2 border-imperial-red rounded-lg"
                  : "border border-gray-200 hover:border-gray-300"
              }
              ${
                actualLayout === "vertical"
                  ? "flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50"
                  : "flex-shrink-0 w-28 m-1 hover:translate-y-[-5px] rounded-lg"
              }
            `}
            onClick={() => onAlbumSelect({ id: album.id, title: album.title })}
          >
            <img
              src={album.artworkUrl}
              alt={album.title}
              className={
                actualLayout === "vertical"
                  ? "w-12 h-12 object-cover rounded-md flex-shrink-0"
                  : "w-full h-28 object-cover rounded-t-lg"
              }
            />
            <p
              className={
                actualLayout === "vertical"
                  ? "text-xs font-medium flex-grow line-clamp-2"
                  : "text-xs text-center p-2 font-medium truncate"
              }
            >
              {album.title}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AlbumCarousel;

```

# components\AlbumCarousel\styles.tss

```tss

```

# components\common\AuthForm.tsx

```tsx
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
          <div className="flex justify-center gap-2 items-center mt-4">
            <a
              href={"/forgot-password"}
              className="text-xs hover:text-blood-red"
            >
              {"Forgot Password?"}
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthForm;

```

# components\common\Container.tsx

```tsx
import React from "react";
import { ReactNode } from "react";

const BaseContainer = ({ children }: { children: ReactNode }) => {
  return (
    <div className="mx-auto px-4 md:px-8 pb-11 bg-night min-h-screen w-full max-w-full flex items-center justify-center">
      <div className="w-full max-w-screen-xl">{children}</div>
    </div>
  );
};

export default BaseContainer;

```

# components\common\ErrorMessage.tsx

```tsx
import React from "react";

interface ErrorMessageProps {
  message: string;
  className?: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  className = "",
}) => (
  <div
    className={`p-4 bg-red-50 border border-red-200 rounded-md ${className}`}
  >
    <div className="flex items-center text-red-600">
      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
      <span className="font-medium">{message}</span>
    </div>
  </div>
);

export default ErrorMessage;

```

# components\common\Footer.tsx

```tsx
import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="mt-8 border-t border-gray-200 py-4 text-center text-sm text-gray-600">
      <div className="mt-12 p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div>
            <h3 className="text-lg font-semibold mb-2">1. Create an Account</h3>
            <p>Sign up for free and join our community of music enthusiasts.</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">
              2. Share Your Reviews
            </h3>
            <p>Rate and review songs you love, hate, or feel neutral about.</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">
              3. Discover New Music
            </h3>
            <p>
              Browse reviews from other users to find your next favorite song.
            </p>
          </div>
        </div>
      </div>
      <p className="mt-5">© 2023 RHCP Reviews. All rights reserved.</p>
      <p>Data from Red Hot Chili Peppers discography</p>
    </footer>
  );
};

export default Footer;

```

# components\common\index.tsx

```tsx
export { default as LoadingSpinner } from "./LoadingSpinner";
export { default as ErrorMessage } from "./ErrorMessage";

```

# components\common\LoadingSpinner.tsx

```tsx
import React from "react";

const LoadingSpinner: React.FC = () => (
  <div className="flex justify-center items-center h-32">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
  </div>
);

export default LoadingSpinner;

```

# components\common\Navbar.tsx

```tsx
import React from "react";
import { Link } from "react-router-dom";
import { getCurrentUser, logout } from "../../services/authService";
import { ReactComponent as Logo } from "../../assets/rht-logo.svg";
import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import DOMPurify from "dompurify";

const UserDropdown = () => {
  const currentUser = getCurrentUser();

  if (!currentUser) return null;
  const safeUsername = DOMPurify.sanitize(currentUser.username);

  return (
    <Menu as="div" className="relative border-b border-white-smoke">
      <MenuButton className="flex items-center p-2 gap-x-1 text-sm font-semibold hover:bg-white leading-6">
        <span> {safeUsername}</span>
        <ChevronDownIcon className="h-5 w-5" aria-hidden="true" />
      </MenuButton>

      <MenuItems className="absolute right-0 w-56 origin-top-right border-1 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
        <div className="py-1">
          <MenuItem>
            {({ active }: { active: boolean }) => (
              <Link
                to="/groups"
                className={`${
                  active ? "bg-gray-100 text-gray-900" : "text-gray-700"
                } block px-4 py-2 text-sm`}
              >
                Groups
              </Link>
            )}
          </MenuItem>{" "}
          <MenuItem>
            {({ active }: { active: boolean }) => (
              <Link
                to="/me"
                className={`${
                  active ? "bg-gray-100 text-gray-900" : "text-gray-700"
                } block px-4 py-2 text-sm`}
              >
                Settings
              </Link>
            )}
          </MenuItem>
          <MenuItem>
            {({ active }: { active: boolean }) => (
              <Link
                to="/"
                onClick={() => {
                  logout();
                  window.location.reload();
                }}
                className={`${
                  active ? "bg-gray-100 text-gray-900" : "text-gray-700"
                } block px-4 py-2 text-sm`}
              >
                Logout
              </Link>
            )}
          </MenuItem>
        </div>
      </MenuItems>
    </Menu>
  );
};

const Navbar: React.FC = () => {
  const currentUser = getCurrentUser();

  return (
    <nav className="mx-auto w-full flex items-center justify-between border-b border-gray-200 mt-4 mb-2 p-4 py-6 lg:px-8 select-none">
      <div className="flex-1 flex items-center">
        <Link
          to="/groups"
          className="text-sm font-semibold leading-6 text-gray-900 hover:text-gray-700 mr-4"
        >
          Groups
        </Link>
      </div>

      <div className="flex justify-center">
        <Link to="/" className="-m-1.5 p-1.5">
          <Logo className="h-24 w-auto" />
        </Link>
      </div>

      <div className="flex-1 flex justify-end gap-x-4">
        {currentUser ? (
          <UserDropdown />
        ) : (
          <>
            <Link
              to="/register"
              className="text-sm font-semibold leading-6 text-gray-900 hover:text-gray-700"
            >
              Register
            </Link>
            <Link
              to="/login"
              className="text-sm font-semibold leading-6 text-gray-900 hover:text-gray-700"
            >
              Login
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

```

# components\Profile\AvatarSelector.tsx

```tsx
import { ReactComponent as PepperAvatar } from "../../assets/pepper-avatar.svg";
import { JSX, useEffect, useState } from "react";

export default function AvatarSelector({
  selectedColor,
  onSelect,
}: {
  selectedColor: string;
  onSelect: (avatarComponent: JSX.Element, color: string) => void;
}) {
  const colors = [
    "#EF4444", // red-500
    "#10B981", // green-500
    "#3B82F6", // blue-500
    "#F59E0B", // yellow-500
    "#EC4899", // pink-500
    "#8B5CF6", // purple-500
    "#14B8A6", // teal-500
    "#FB923C", // orange-500
  ];

  const [color, setColor] = useState<string>(selectedColor || colors[0]);

  useEffect(() => {
    if (selectedColor) {
      setColor(selectedColor);
    }
  }, [selectedColor]);

  const handleSelect = (newColor: string) => {
    setColor(newColor);
    onSelect(<PepperAvatar style={{ color: newColor }} />, newColor);
  };

  return (
    <div className="space-y-4">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center"
        style={{ backgroundColor: color }}
      >
        <PepperAvatar className="w-12 h-12 text-white" style={{ color }} />
      </div>

      <div className="flex gap-2 flex-wrap">
        {colors.map((c) => (
          <button
            key={c}
            onClick={() => handleSelect(c)}
            className={`w-8 h-8 rounded-full border-2 ${
              color === c ? "border-black" : "border-white"
            }`}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
    </div>
  );
}

```

# components\Profile\MyProfile.tsx

```tsx
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

```

# components\Song.tsx

```tsx
import React from "react";

interface SongProps {
  title: string;
  album: string;
  rating: number;
  userName: string;
}

const Song: React.FC<SongProps> = ({ title, album, rating, userName }) => {
  return (
    <tr>
      <td>{title}</td>
      <td>{album}</td>
      <td>{rating}</td>
    </tr>
  );
};

export default Song;

```

# components\SongStats\ChartComponent.tsx

```tsx
import React, { useMemo } from "react";
import ApexChart from "react-apexcharts";
import { SongStat, FiltersState } from "../../types/rhcp-types";
import { ApexOptions } from "apexcharts";

interface ChartProps {
  albumTitle: string;
  songStats: SongStat[];
  filters: FiltersState;
}
const ChartComponent = React.memo(
  ({ albumTitle, songStats, filters }: ChartProps) => {
    // Process the data in a useMemo to prevent unnecessary recalculations
    const { series, categories } = useMemo(() => {
      const sortedSongs = [...songStats].sort(
        (a, b) => a.trackNumber - b.trackNumber
      );
      const categories = sortedSongs.map(
        (song) => `${song.trackNumber}. ${song.title}`
      );

      const publicSeries = {
        name: "Public Average",
        data: sortedSongs.map((song) => song.publicAverage ?? null),
        color: "#E53E3E",
      };

      const groupSeries =
        filters.groupId !== "all"
          ? {
              name: "Group Average",
              data: sortedSongs.map((song) => song.groupAverage ?? null),
              color: "#ECC94B",
            }
          : null;

      const currentUserSeries = {
        name: "Your Ratings",
        data: sortedSongs.map((song) => song.currentUserRating ?? null),
        color: "#2B6CB0",
      };

      const selectedUserSeries =
        filters.groupId !== "all" && filters.selectedUserName
          ? {
              name: filters.selectedUserName,
              data: sortedSongs.map((song) => song.selectedUserRating ?? null),
              color: "#4FD1C5",
            }
          : null;

      const seriesArray = [publicSeries];
      if (groupSeries) seriesArray.push(groupSeries);
      if (selectedUserSeries) seriesArray.push(selectedUserSeries as any);
      seriesArray.push(currentUserSeries as any); // Always include your own last for visibility

      return { series: seriesArray, categories };
    }, [songStats, filters]);

    // Calculate dynamic height based on number of songs
    const chartHeight = useMemo(() => {
      // Base height is 450px, but increases with more songs
      const baseHeight = 450;

      // Add height based on number of songs
      const adjustedHeight = Math.max(
        baseHeight,
        baseHeight + (songStats.length - 10) * 15
      );

      return adjustedHeight;
    }, [songStats.length]);

    // Calculate dynamic width based on number of songs to ensure all fit
    const chartWidth = useMemo(() => {
      // Each song needs roughly 50-60px width + margins
      // We calculate a dynamic width based on the number of songs
      // with a minimum of 100% to fill container
      const minWidth = Math.max(100, songStats.length * 50);

      // Return as percentage string for responsive sizing
      return `100%`;
    }, [songStats.length]);

    // Configure chart options
    const options: ApexOptions = {
      chart: {
        id: "album-stats-chart",
        type: "bar",
        height: chartHeight,
        fontFamily: "Inter, system-ui, sans-serif",
        toolbar: {
          show: false,
        },
        animations: {
          enabled: true,
          speed: 400,
          dynamicAnimation: {
            enabled: true,
            speed: 250,
          },
        },
      },
      states: {
        hover: {
          filter: {
            type: "darken",
          },
        },
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: songStats.length > 15 ? "85%" : "60%", // Thinner bars for many songs
          borderRadius: 3,
          dataLabels: {
            position: "top",
          },
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        show: true,
        width: 2,
        colors: ["transparent"],
      },
      xaxis: {
        categories,
        labels: {
          rotate: songStats.length > 10 ? -45 : 0, // Only rotate for many songs
          rotateAlways: songStats.length > 10,
          style: {
            fontSize: songStats.length > 15 ? "10px" : "11px", // Smaller font for many songs
            fontWeight: 500,
          },
          hideOverlappingLabels: false,
          trim: songStats.length > 20, // Only trim for very many songs
          minHeight: 60,
          maxHeight: 120,
        },
        axisBorder: {
          show: true,
        },
        axisTicks: {
          show: true,
        },
        tickAmount: songStats.length > 20 ? undefined : songStats.length, // Control tick amount
        tickPlacement: "on",
      },
      yaxis: {
        min: 0,
        max: 10,
        tickAmount: 5,
        forceNiceScale: true,
        title: {
          text: "Rating",
          style: {
            fontSize: "13px",
            fontWeight: 600,
          },
        },
        labels: {
          formatter: (value) =>
            value % 1 === 0 ? value.toString() : value.toFixed(1),
        },
      },
      fill: {
        opacity: 0.85,
      },
      tooltip: {
        y: {
          formatter: (val) =>
            val !== null && val !== undefined ? val.toFixed(1) : "No rating",
        },
        shared: true,
        intersect: false,
        // Enhanced tooltip to show full song title
        custom: function ({ series, seriesIndex, dataPointIndex, w }) {
          const songTitle = songStats[dataPointIndex]?.title || "";
          const rating = series[seriesIndex][dataPointIndex];
          const formattedRating =
            rating !== null && rating !== undefined
              ? rating.toFixed(1)
              : "No rating";
          const seriesName = w.globals.seriesNames[seriesIndex];

          return `<div class="arrow_box"> <div class="apexcharts-tooltip-title" style="font-weight: bold; margin-bottom: 5px; font-size: 13px;">
                  ${songTitle} 
                </div><span class="apexcharts-tooltip-text-y-label">${seriesName}: </span>
                    <span class="apexcharts-tooltip-text-y-value">${formattedRating}</span>
                <div class="apexcharts-tooltip-series-group">
                  <span class="apexcharts-tooltip-marker" style="background-color: ${w.globals.colors[seriesIndex]}"></span>
                  <div>
                   
                  </div>
                </div></div>`;
        },
      },
      legend: {
        position: "top",
        horizontalAlign: "right",
        fontSize: "13px",
        markers: {
          size: 12,
        },
        itemMargin: {
          horizontal: 10,
          vertical: 0,
        },
      },
      grid: {
        borderColor: "#f1f1f1",
        strokeDashArray: 3,
        padding: {
          bottom: songStats.length > 10 ? 20 : 10, // More padding for rotated labels
        },
        xaxis: {
          lines: {
            show: false,
          },
        },
      },
      responsive: [
        {
          breakpoint: 768,
          options: {
            plotOptions: {
              bar: {
                columnWidth: "85%",
              },
            },
            legend: {
              position: "bottom",
              horizontalAlign: "center",
            },
            xaxis: {
              labels: {
                rotate: -45, // Always rotate on mobile
                rotateAlways: true,
                style: {
                  fontSize: "10px",
                },
              },
            },
          },
        },
      ],
    };

    if (!songStats || songStats.length === 0) {
      return (
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h4 className="text-gray-700 text-lg font-semibold mb-4">
            {albumTitle ? `${albumTitle} Ratings` : "Select an Album"}
          </h4>
          <div className="text-gray-500 text-center py-8">
            No rating data available
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-6">
        <h4 className="text-gray-700 text-lg font-semibold mb-4">
          {albumTitle ? `${albumTitle} Ratings` : "Select an Album"}
        </h4>
        <div className="chart-container w-full">
          <ApexChart
            options={options}
            series={series}
            type="bar"
            height={chartHeight}
            width="100%"
          />
        </div>
      </div>
    );
  }
);

export default ChartComponent;

```

# components\SongStats\CommentInput.tsx

```tsx
// // CommentInput.tsx
// import React from "react";

// interface CommentInputProps {
//   songId: number;
//   content: string;
//   isEditing: boolean;
//   handleContentChange: (songId: number, content: string) => void;
// }

// const CommentInput: React.FC<CommentInputProps> = ({
//   songId,
//   content,
//   isEditing,
//   handleContentChange,
// }) => {
//   return (
//     <div className="relative">
//       <input
//         type="text"
//         value={content}
//         onChange={(e) => handleContentChange(songId, e.target.value)}
//         placeholder="Add a comment"
//         className="w-full border-gray-300 rounded-sm text-sm p-1 focus:border-indigo-500 focus:ring-indigo-500 placeholder:text-gray-300 placeholder:italic"
//       />
//       {isEditing && (
//         <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
//           <div className="animate-pulse h-2 w-2 rounded-full bg-indigo-500"></div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default React.memo(CommentInput);

```

# components\SongStats\ExpandedReviewSection.tsx

```tsx
// ExpandedReviewSection.tsx
import React from "react";
import { Rating } from "react-simple-star-rating";
import { SongStat, UserReview } from "../../types/rhcp-types";
import ReviewItem from "./ReviewItem";

interface ExpandedReviewSectionProps {
  song: SongStat;
  isAuthenticated: boolean;
  loadingReviews: { [key: number]: boolean };
  userReviewsRef: React.MutableRefObject<{ [key: number]: UserReview[] }>;
  user: any;
}

const ExpandedReviewSection: React.FC<ExpandedReviewSectionProps> = ({
  song,
  isAuthenticated,
  loadingReviews,
  userReviewsRef,
  user,
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  return (
    <tr>
      <td colSpan={isAuthenticated ? 7 : 6} className="px-4 py-4 bg-gray-50">
        <div className="border-t border-b border-gray-200 py-4">
          <h4 className="text-lg font-medium text-gray-900 mb-3">
            All Reviews ({song.reviewCount})
          </h4>

          {loadingReviews[song.id] ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : userReviewsRef.current[song.id]?.length > 0 ? (
            <div className="space-y-4">
              {userReviewsRef.current[song.id].map((review) => (
                <ReviewItem
                  key={review.id}
                  review={review}
                  isCurrentUser={user && review.userId === user.id}
                  formatDate={formatDate}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-6 bg-gray-50 rounded border border-gray-200">
              <p className="text-gray-500">No reviews yet for this song.</p>
              {isAuthenticated && (
                <p className="text-sm text-gray-500 mt-1">
                  Be the first to leave a review!
                </p>
              )}
            </div>
          )}
        </div>
      </td>
    </tr>
  );
};

export default React.memo(ExpandedReviewSection);

```

# components\SongStats\Filters.tsx

```tsx
import React from "react";
import { FiltersState, Group, GroupMember } from "../../types/rhcp-types";

interface FiltersProps {
  groups: Group[];
  members: GroupMember[];
  filters: FiltersState;
  onFilterChange: (filters: Partial<FiltersState>) => void;
  loadingMembers?: boolean;
  currentUserId: string | undefined;
}

export const Filters: React.FC<FiltersProps> = ({
  groups,
  members,
  filters,
  onFilterChange,
  loadingMembers = false,
  currentUserId,
}) => {
  const filteredMembers = members.filter((m) => m.id !== Number(currentUserId));

  return (
    <div className="flex flex-wrap gap-3 items-center bg-white rounded-lg p-3 shadow-sm">
      {/* Group Filter */}
      <div className="flex-grow min-w-[150px]">
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Group
        </label>
        <select
          value={filters.groupId}
          onChange={(e) => onFilterChange({ groupId: e.target.value })}
          className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="all">All (Public)</option>
          {groups.map((group) => (
            <option key={group.id} value={group.id.toString()}>
              {group.name}
            </option>
          ))}
        </select>
      </div>

      {/* User Filter - only show if a group is selected */}
      {filters.groupId !== "all" && (
        <div className="flex-grow min-w-[150px]">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            User Ratings
          </label>
          <select
            value={filters.userId ?? "all"}
            onChange={(e) => {
              const selectedUserId = e.target.value;
              const selectedUser =
                selectedUserId === "all"
                  ? undefined
                  : filteredMembers.find(
                      (m) => m.id.toString() === selectedUserId
                    );

              onFilterChange({
                userId: selectedUserId === "all" ? undefined : selectedUserId,
                selectedUserName: selectedUser
                  ? selectedUser.username
                  : undefined,
              });
            }}
            className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            disabled={loadingMembers}
          >
            <option value="all">All Users</option>
            {filteredMembers.map((member) => (
              <option key={member.id} value={member.id.toString()}>
                {member.username}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};
export default Filters;

```

# components\SongStats\index.ts

```ts
export { default as SongStats } from "./SongStats";
export { default as Filters } from "./Filters";
export { default as ChartComponent } from "./ChartComponent";
export { default as ReviewsTable } from "./ReviewsTable";

```

# components\SongStats\RatingComponent.tsx

```tsx
import { Rating } from "react-simple-star-rating";
import { LoadingSpinner } from "../common";
import { useState, useEffect } from "react";

interface RatingComponentProps {
  value: number;
  onSubmit: (stars: number) => void;
  isSubmitting?: boolean;
}

const RatingComponent: React.FC<RatingComponentProps> = ({
  value,
  onSubmit,
  isSubmitting,
}) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);
  return (
    <div className="relative inline-flex items-center">
      <Rating
        onClick={onSubmit}
        initialValue={localValue / 2}
        size={20}
        allowFraction
        iconsCount={5}
        transition
        readonly={isSubmitting}
      />{" "}
      <span className="ml-2 text-sm font-medium">{localValue.toFixed(1)}</span>
      {isSubmitting && (
        <div className="ml-2">
          <LoadingSpinner />
        </div>
      )}
    </div>
  );
};
export default RatingComponent;

```

# components\SongStats\ReviewItem.tsx

```tsx
// ReviewItem.tsx
import React from "react";
import { Rating } from "react-simple-star-rating";
import { UserReview } from "../../types/rhcp-types";

interface ReviewItemProps {
  review: UserReview;
  isCurrentUser: boolean;
  formatDate: (date: string) => string;
}

const ReviewItem: React.FC<ReviewItemProps> = ({
  review,
  isCurrentUser,
  formatDate,
}) => {
  return (
    <div className="bg-white p-3 rounded border border-gray-200">
      <div className="flex justify-between items-start">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <img
              className="h-8 w-8 rounded-full"
              src={review.author?.image || "/images/default-user.png"}
              alt={review.author?.username || "User"}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "/images/default-user.png";
              }}
            />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">
              {review.author?.username || "Anonymous"}
              {isCurrentUser && (
                <span className="ml-2 text-xs font-normal text-gray-500">
                  (You)
                </span>
              )}
            </p>
            <p className="text-xs text-gray-500">
              {formatDate(review.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center">
          <Rating
            initialValue={review.rating / 2}
            size={16}
            readonly
            allowFraction
            iconsCount={5}
          />
          <span className="ml-1 text-sm font-medium">
            {review.rating.toFixed(1)}
          </span>
        </div>
      </div>

      {review.content && (
        <div className="mt-2 text-sm text-gray-700">
          <p>{review.content}</p>
        </div>
      )}
    </div>
  );
};

export default React.memo(ReviewItem);

```

# components\SongStats\ReviewRow.tsx

```tsx
// ReviewRow.tsx
import React, { useMemo } from "react";
import { Rating } from "react-simple-star-rating";
import { SongStat, UserReview } from "../../types/rhcp-types";
import RatingComponent from "./RatingComponent";

interface ReviewRowProps {
  song: SongStat;
  isGroupView: boolean;
  groupId?: string;
  isAuthenticated: boolean;
  expandedSongId: number | null;
  currentRatings: { [key: number]: number };
  submitting: { [key: number]: boolean };
  handleExpand: (songId: number) => void;
  handleRatingChange: (songId: number, rating: number) => void;
  filteredReviews: UserReview[];
  userId?: Number;
}

const ReviewRow: React.FC<ReviewRowProps> = ({
  song,
  isGroupView,
  groupId,
  isAuthenticated,
  expandedSongId,
  currentRatings,
  submitting,
  handleExpand,
  handleRatingChange,
  filteredReviews,
  userId,
}) => {
  const hasUserReview = useMemo(() => {
    if (!isGroupView)
      return filteredReviews.some((review) => review.userId === userId);

    return filteredReviews.some(
      (review) =>
        review.userId === userId && review.groupId === parseInt(groupId || "0")
    );
  }, [filteredReviews, userId, groupId, isGroupView]);

  const otherReviewsCount = useMemo(() => {
    if (!isGroupView) return filteredReviews.length - (hasUserReview ? 1 : 0);

    return filteredReviews.filter(
      (review) =>
        review.groupId === parseInt(groupId || "0") && review.userId !== userId
    ).length;
  }, [filteredReviews, userId, groupId, isGroupView, hasUserReview]);

  return (
    <tr
      className={`hover:bg-gray-50 ${
        expandedSongId === song.id ? "bg-gray-50" : ""
      }`}
    >
      <td className="px-3 py-2 text-sm">{song.trackNumber}</td>
      <td className="px-3 py-2 text-sm font-medium">{song.title}</td>

      {/* Public Avg */}

      <td className="px-3 py-2 text-sm text-right">
        {song.publicAverage.toFixed(1)}
      </td>

      {/* Group Avg or empty cell */}
      {isGroupView ? (
        <td className="px-3 py-2 text-sm text-right">
          {(song.groupAverage || 0).toFixed(1)}
        </td>
      ) : (
        <td className="px-3 py-2 text-sm text-right"></td>
      )}

      {/* Your Rating */}
      <td className="px-2 py-2 text-sm">
        {isAuthenticated ? (
          <RatingComponent
            value={currentRatings[song.id]}
            onSubmit={(stars: number) => handleRatingChange(song.id, stars)}
            isSubmitting={submitting[song.id]}
          />
        ) : (
          <div>{song.currentUserRating?.toFixed(1) || "-"}</div>
        )}
      </td>

      {/* Actions */}
      <td className="px-3 py-2 text-right">
        <div className="flex gap-2 justify-end">
          <button
            className={`rounded-md px-3 py-2 text-sm ${
              expandedSongId === song.id
                ? "bg-indigo-100 text-indigo-700"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
            onClick={() => handleExpand(song.id)}
          >
            {hasUserReview ? "Edit Your Review" : "Add Review"}
          </button>

          {otherReviewsCount > 0 && (
            <button
              className="bg-gray-100 hover:bg-gray-200 rounded-md px-3 py-2 text-sm"
              onClick={() => handleExpand(song.id)}
            >
              {`Read Reviews (${otherReviewsCount})`}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};

export default React.memo(ReviewRow);

```

# components\SongStats\ReviewsTable.tsx

```tsx
import React, { useState, useCallback, useRef, useMemo } from "react";
import { Rating } from "react-simple-star-rating";
import { SongStat, FiltersState, UserReview } from "../../types/rhcp-types";
import { useAuth } from "../../context/AuthContext";
import { fetchWrapper } from "../../services/api";
import ReviewItem from "./ReviewItem";
import ReviewRow from "./ReviewRow";

interface TableProps {
  songStats: SongStat[];
  filters: FiltersState;
  albumId: number;
  onReviewSubmitted?: (updatedSong?: SongStat) => void;
}

interface ReviewState {
  ratings: Record<number, number>;
  contents: Record<number, string>;
  submitting: Record<number, boolean>;
  reviews: Record<number, UserReview[]>;
  loading: Record<number, boolean>;
}

const ReviewsTable = ({
  songStats,
  filters,
  albumId,
  onReviewSubmitted,
}: TableProps) => {
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const [expandedSongId, setExpandedSongId] = useState<number | null>(null);
  const [reviews, setReviews] = useState<Record<number, UserReview[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<ReviewState>({
    ratings: {},
    contents: {},
    submitting: {},
    reviews: {},
    loading: {},
  });

  const currentRatings = useMemo(
    () =>
      songStats.reduce((acc, song) => {
        const inProgress = state.ratings[song.id];
        return {
          ...acc,
          [song.id]:
            inProgress ?? song.currentUserRating ?? song.groupAverage ?? 0,
        };
      }, {} as Record<number, number>),
    [songStats, state.ratings]
  );

  const updateReviewState = (updates: Partial<ReviewState>) => {
    setState((prev) => ({
      ...prev,
      ...Object.keys(updates).reduce(
        (acc, key) => ({
          ...acc,
          [key]: {
            ...prev[key as keyof ReviewState],
            ...updates[key as keyof ReviewState],
          },
        }),
        {}
      ),
    }));
  };

  const isCurrentUserSelected = filters.userId === String(user?.id);

  const contentsRef = useRef<Record<number, string>>({});

  const handleRatingChange = useCallback(
    async (songId: number, stars: number) => {
      const rating = stars * 2;
      const songData = songStats.find((s) => s.id === songId);
      // Immediate rating update
      updateReviewState({
        ratings: { [songId]: rating },
        submitting: { [songId]: true },
      });

      if (!songData) return;

      const isNewReview = !songData.currentUserReviewId;
      const tempReviewCount = songData.reviewCount + (isNewReview ? 1 : 0);

      // Optimistic update
      const content = contentsRef.current[songId] || "";

      setState((prev) => {
        const existingReviews = prev.reviews[songId] || [];
        const existingIndex = existingReviews.findIndex(
          (r) => r.userId === user?.id
        );

        const updatedReview = {
          ...(existingIndex >= 0 ? existingReviews[existingIndex] : {}),
          id: songData.currentUserReviewId || Date.now(), // Use real ID if available
          userId: user!.id,
          songId,
          rating: stars * 2,
          content: content,
          createdAt: new Date().toISOString(),
          author: {
            id: user!.id,
            username: user!.username,
            image: user!.image,
          },
        };

        return {
          ...prev,
          reviews: {
            ...prev.reviews,
            [songId]:
              existingIndex >= 0
                ? [
                    ...existingReviews.slice(0, existingIndex),
                    updatedReview,
                    ...existingReviews.slice(existingIndex + 1),
                  ]
                : [updatedReview, ...existingReviews],
          },
          ratings: {
            ...prev.ratings,
            [songId]: stars * 2, // Update rating immediately
          },
        };
      });

      onReviewSubmitted?.({
        ...songData,
        currentUserRating: rating,
        reviewCount: tempReviewCount,
        currentUserReviewId: songData.currentUserReviewId || Date.now(), // Temp ID
      });

      try {
        const method = songData.currentUserReviewId ? "PUT" : "POST";
        const payload: any = {
          songId,
          rating,
          content,
        };

        const response = await fetchWrapper(
          `/reviews/${songData?.currentUserReviewId || ""}`,
          {
            method,
            headers: getAuthHeaders(),
            body: JSON.stringify(payload),
          }
        );

        if (response.id) {
          setState((prev) => ({
            ...prev,
            reviews: {
              ...prev.reviews,
              [songId]: (prev.reviews[songId] || []).map((review) =>
                review.userId === user?.id
                  ? { ...review, id: response.id }
                  : review
              ),
            },
          }));
        }
        updateReviewState({
          contents: { [songId]: response.content },
          submitting: { [songId]: false },
        });
        // Final update with actual data
        onReviewSubmitted?.({
          ...songData,
          currentUserRating: rating,
          currentUserReviewId: response.id,
          reviewCount: songData.reviewCount + (method === "POST" ? 1 : 0),
        });
      } catch (err) {
        // Rollback
        onReviewSubmitted?.(songData);
      }
    },
    [songStats, onReviewSubmitted]
  );

  const handleExpand = useCallback(
    async (songId: number) => {
      const isExpanding = expandedSongId !== songId;
      setExpandedSongId(isExpanding ? songId : null);

      if (isExpanding) {
        updateReviewState({ loading: { [songId]: true } });

        try {
          // Fetch public reviews
          const params = new URLSearchParams({
            songId: songId.toString(),
            ...(filters.groupId !== "all" && {
              groupId: filters.groupId,
              includeRatings: "true",
            }),
          });

          const response = await fetchWrapper(`/reviews/song?${params}`, {
            headers: getAuthHeaders(),
          });

          // Filter reviews with content
          const filteredReviews = response.reviews;

          // Check if user has existing review
          const userReview = response.reviews.find(
            (r: UserReview) => r.userId === user?.id
          );

          updateReviewState({
            reviews: { [songId]: filteredReviews },
            contents: { [songId]: userReview?.content || "" },
            loading: { [songId]: false },
          });
        } catch (err) {
          updateReviewState({ loading: { [songId]: false } });
        }
      }
    },
    [expandedSongId, filters.groupId, user?.id]
  );

  const getAuthHeaders = () => {
    const headers: { "Content-Type": string; Authorization?: string } = {
      "Content-Type": "application/json",
    };

    if (user?.token) {
      headers["Authorization"] = `Bearer ${user.token}`;
    }

    return headers;
  };

  const handleContentChange = useCallback((songId: number, content: string) => {
    contentsRef.current = { ...contentsRef.current, [songId]: content };
    updateReviewState({ contents: { [songId]: content } });
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  const autoExpand = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    e.target.style.height = "inherit";
    e.target.style.height = `${e.target.scrollHeight}px`;
  };
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm select-none">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button
            className="float-right text-red-700"
            onClick={() => setError(null)}
          >
            &times;
          </button>
        </div>
      )}

      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-900">
              #
            </th>
            <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-900">
              Song
            </th>

            {/* Public Avg */}

            <th className="px-4 py-3.5 text-right text-sm font-semibold text-gray-900">
              Public Avg
            </th>

            {/* Group Avg */}
            {filters.groupId !== "all" ? (
              <th className="px-4 py-3.5 text-right text-sm font-semibold text-gray-900">
                Group Avg
              </th>
            ) : (
              <th className="px-4 py-3.5 text-right text-sm" />
            )}

            <th className="px-4 py-3.5 text-right text-sm font-semibold text-gray-900">
              Your Rating
            </th>
            <th className="px-4 py-3.5 text-right text-sm font-semibold text-gray-900">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {songStats.map((song) => (
            <React.Fragment key={song.id}>
              <ReviewRow
                song={song}
                isGroupView={filters.groupId !== "all"}
                groupId={filters.groupId}
                isAuthenticated={isAuthenticated}
                expandedSongId={expandedSongId}
                currentRatings={currentRatings}
                submitting={state.submitting}
                handleExpand={handleExpand}
                handleRatingChange={handleRatingChange}
                filteredReviews={state.reviews[song.id] || []}
                userId={user?.id}
              />
              {expandedSongId === song.id && (
                <tr>
                  <td colSpan={6} className="px-4 py-4 bg-gray-50">
                    <div className="border-t border-gray-200 py-4">
                      {isAuthenticated && (
                        <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
                          <h4 className="text-lg font-medium text-gray-900 mb-3">
                            Your Review
                          </h4>
                          <div className="mb-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Rating
                            </label>
                            <div className="flex items-center">
                              <Rating
                                onClick={(rate) =>
                                  handleRatingChange(song.id, rate)
                                }
                                initialValue={
                                  (currentRatings[song.id] || 0) / 2
                                }
                                size={24}
                                allowFraction
                                iconsCount={5}
                              />
                              <span className="ml-2 text-gray-700">
                                {currentRatings[song.id]?.toFixed(1) || "0.0"}
                                /10
                              </span>
                            </div>
                          </div>
                          <div className="mb-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Comments
                            </label>
                            <textarea
                              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                              rows={3}
                              maxLength={500}
                              value={state.contents[song.id] || ""}
                              onChange={(e) => {
                                handleContentChange(song.id, e.target.value);
                                autoExpand(e);
                              }}
                              placeholder="Share your thoughts..."
                            />{" "}
                            <div className="text-right text-xs text-gray-500 mt-1">
                              {state.contents[song.id]?.length || 0}/500
                            </div>
                          </div>
                          <div className="flex justify-end">
                            <form onSubmit={(e) => e.preventDefault()}>
                              <button
                                type="button"
                                className={`bg-indigo-600 text-white px-4 py-2 rounded-md ${
                                  state.submitting[song.id]
                                    ? "opacity-50 cursor-not-allowed"
                                    : ""
                                }`}
                                onClick={() =>
                                  handleRatingChange(
                                    song.id,
                                    (currentRatings[song.id] || 0) / 2
                                  )
                                }
                                disabled={state.submitting[song.id]}
                              >
                                {state.submitting[song.id]
                                  ? "Saving..."
                                  : "Save Review"}
                              </button>
                            </form>
                          </div>
                        </div>
                      )}

                      <h4 className="text-lg font-medium text-gray-900 mb-3">
                        All Reviews ({song.reviewCount})
                      </h4>

                      {state.reviews[song.id]?.length > 0 ? (
                        <div className="space-y-4">
                          {state.reviews[song.id]
                            .sort(
                              (a, b) =>
                                new Date(b.createdAt).getTime() -
                                new Date(a.createdAt).getTime()
                            )
                            .map((review) => (
                              <ReviewItem
                                key={review.id}
                                review={review}
                                isCurrentUser={user?.id === review.userId}
                                formatDate={formatDate}
                              />
                            ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 bg-gray-50 rounded border border-gray-200">
                          <p className="text-gray-500">
                            No reviews yet for this song.
                          </p>
                          {isAuthenticated && (
                            <p className="text-sm text-gray-500 mt-1">
                              Be the first to leave a review!
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ReviewsTable;

```

# components\SongStats\SongStats.tsx

```tsx
import { useState, useCallback, useEffect } from "react";
import {
  Album,
  FiltersState,
  Group,
  SongStat,
  SongStatsProps,
} from "../../types/rhcp-types";
import ErrorMessage from "../common/ErrorMessage";
import LoadingSpinner from "../common/LoadingSpinner";
import ReviewsTable from "./ReviewsTable";
import Filters from "./Filters";
import ChartComponent from "./ChartComponent";
import AlbumCarousel from "../AlbumCarousel/AlbumCarousel";
import { useAlbumStats } from "../../hooks/useAlbumStats";
import { useGroupMembers } from "../../hooks/useGroupMembers";
import { useAuth } from "../../context/AuthContext";

const SongStats = ({
  albumId,
  albumTitle,
  userId,
  groups = [],
  selectedUserId,
  selectedUserName,
}: SongStatsProps) => {
  const { user } = useAuth();
  const [localStats, setLocalStats] = useState<SongStat[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<Album>({
    id: albumId,
    title: albumTitle,
    artworkUrl: "",
    releaseDate: "",
  });

  // State hooks
  const [filters, setFilters] = useState<FiltersState>({
    groupId: "all",
    userId: userId || "all",
    selectedUserId: selectedUserId || "all",
    selectedUserName: selectedUserName || "user",
  });
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  // Derived values
  const effectiveAlbumId = selectedAlbum?.id || albumId;
  const { stats, loading, error } = useAlbumStats(effectiveAlbumId, filters);
  const { members, loading: membersLoading } = useGroupMembers(filters.groupId);

  // Sync local stats with API data
  useEffect(() => {
    if (stats.length > 0) {
      setLocalStats(stats);
    }
  }, [stats]);

  // Album fetching
  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/albums");
        const data = await response.json();

        if (data.data?.length > 0) {
          setAlbums(data.data);
          const matchingAlbum = albumId
            ? data.data.find((a: Album) => a.id === albumId)
            : data.data[0];
          if (matchingAlbum) setSelectedAlbum(matchingAlbum);
        }
      } catch (error) {
        console.error("Error fetching albums:", error);
      }
    };
    fetchAlbums();
  }, [albumId]);

  // Responsive layout
  useEffect(() => {
    const handleResize = () => setIsLargeScreen(window.innerWidth >= 1024);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Review submission handler
  const handleReviewSubmitted = useCallback((updatedSong?: SongStat) => {
    if (updatedSong) {
      setLocalStats((prev) =>
        prev.map((song) =>
          song.id === updatedSong.id ? { ...song, ...updatedSong } : song
        )
      );
    }
  }, []);

  // Filter change handler
  const handleFilterChange = useCallback(
    (newFilters: Partial<FiltersState>) => {
      setFilters((prev) => ({ ...prev, ...newFilters }));
    },
    []
  );

  // Album selection handler
  const handleAlbumSelect = useCallback(
    (album: { id: number; title: string }) => {
      setSelectedAlbum((prev) => ({
        ...prev,
        id: album.id,
        title: album.title,
      }));

      const url = new URL(window.location.href);
      url.searchParams.set("albumId", album.id.toString());
      window.history.replaceState({}, "", url.toString());
    },
    []
  );

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="song-stats-container my-4 bg-white rounded-lg shadow-md">
      <div className="p-4 border-b border-gray-200">
        <Filters
          groups={groups}
          members={members}
          filters={filters}
          onFilterChange={handleFilterChange}
          loadingMembers={membersLoading}
          currentUserId={userId}
        />
      </div>

      {isLargeScreen ? (
        <div className="flex flex-row">
          <div className="w-1/4 p-4 border-r border-gray-200">
            <AlbumCarousel
              onAlbumSelect={handleAlbumSelect}
              selectedAlbumId={selectedAlbum?.id}
              layout="vertical"
            />
          </div>
          <div className="w-3/4 p-4">
            <ChartComponent
              albumTitle={selectedAlbum?.title || "Album"}
              songStats={localStats}
              filters={filters}
            />
          </div>
        </div>
      ) : (
        <div>
          <div className="w-full p-4">
            <AlbumCarousel
              onAlbumSelect={handleAlbumSelect}
              selectedAlbumId={selectedAlbum?.id}
              layout="horizontal"
            />
          </div>
          <div className="w-full p-4">
            <ChartComponent
              albumTitle={selectedAlbum?.title || "Album"}
              songStats={localStats}
              filters={filters}
            />
          </div>
        </div>
      )}

      <div className="w-full p-4">
        <ReviewsTable
          songStats={localStats}
          filters={filters}
          albumId={effectiveAlbumId}
          onReviewSubmitted={handleReviewSubmitted}
        />
      </div>
    </div>
  );
};

export default SongStats;

```

# config\routes.ts

```ts
import React from "react";
import { JSX } from "react";

interface RouteConfig {
  path: string;
  component: React.LazyExoticComponent<() => JSX.Element>;
  exact?: boolean;
}

export const routes: RouteConfig[] = [
  {
    path: "/",
    component: React.lazy(() => import("../pages/Home")),
    exact: true,
  },
];

```

# context\AuthContext.tsx

```tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import {
  getCurrentUser,
  fetchCurrentUser,
  logout,
  storeAuthData,
} from "../services/authService";
import { AuthContextType, User } from "../types/auth-types";

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAuthenticated: false,
  setUser: () => {},
  logout: () => {},
  login: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state synchronously first
  useEffect(() => {
    const initAuth = async () => {
      try {
        console.log("Auth initialization started");
        // First check session storage for cached user data
        const storedUser = getCurrentUser();
        console.log("Stored user from session storage:", storedUser);

        if (storedUser) {
          // Important: Keep the tokens when setting the user state
          setUser({
            id: storedUser.id,
            username: storedUser.username,
            email: storedUser.email,
            image: storedUser.image,
            token: storedUser.token,
            refreshToken: storedUser.refreshToken,
          });

          // Then try to fetch the latest user data from the server
          try {
            console.log("Fetching current user from API");
            const freshUserData: User = await fetchCurrentUser();
            console.log("Fresh user data from API:", freshUserData);

            // Fix: Explicitly type and access properties instead of using spread
            if (freshUserData && typeof freshUserData === "object") {
              setUser((currentUser) => ({
                id: freshUserData.id || storedUser.id,
                username: freshUserData.username || storedUser.username,
                email: freshUserData.email || storedUser.email,
                image: freshUserData.image || storedUser.image,
                // Keep the tokens from storage
                token: storedUser.token,
                refreshToken: storedUser.refreshToken,
              }));
            }
          } catch (error) {
            console.error("Error fetching current user:", error);
            // Keep using the stored user data
          }
        } else {
          console.log("No stored user found in session storage");
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Then fetch fresh data from API
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Skip API call if no user in storage
        if (!user) {
          console.log("No stored user, skipping API fetch");
          setLoading(false);
          return;
        }

        console.log("Fetching current user from API");
        try {
          const freshUserData = await fetchCurrentUser();
          console.log("Fresh user data from API:", freshUserData);

          // Update user with fresh data but keep tokens
          setUser((currentUser) => {
            if (!currentUser) return null;

            return {
              id: freshUserData.id || currentUser.id,
              username: freshUserData.username || currentUser.username,
              email: freshUserData.email || currentUser.email,
              image: freshUserData.image || currentUser.image,
              // Keep the tokens from current user state
              token: currentUser.token,
              refreshToken: currentUser.refreshToken,
            };
          });
        } catch (error) {
          console.error("Error fetching current user:", error);
        }
      } catch (err) {
        console.error("Auth API fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user?.id]); // Only re-run if user ID changes

  const handleLogout = () => {
    console.log("Logging out");
    logout();
    setUser(null);
  };

  const handleLogin = (userData: any) => {
    console.log("Auth Context: handleLogin called with:", {
      userId: userData.user?.id,
      username: userData.user?.username,
      hasToken: !!userData.token,
      hasRefreshToken: !!userData.refreshToken,
    });

    try {
      // Store auth data in storage
      console.log("Auth Context: Storing auth data");
      storeAuthData(userData);

      // Double check that data was stored
      const storedUser = getCurrentUser();
      console.log("Auth Context: Verified stored user data:", {
        userId: storedUser?.id,
        username: storedUser?.username,
        hasToken: !!storedUser?.token,
      });

      // Update state
      console.log("Auth Context: Setting user state");
      setUser({
        id: userData.user.id,
        username: userData.user.username,
        email: userData.user.email,
        image: userData.user.image,
        token: userData.token,
        refreshToken: userData.refreshToken,
      });

      console.log("Auth Context: User state should now be updated");
    } catch (error) {
      console.error("Auth Context: Error in handleLogin:", error);
    }
  };
  const isAuthenticated = !!user?.token;

  // Log auth state changes for debugging
  useEffect(() => {
    console.log("Auth state updated:", {
      isAuthenticated,
      user: user ? { id: user.id, username: user.username } : null,
      hasToken: !!user?.token,
      loading,
    });
  }, [isAuthenticated, user, loading]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        setUser,
        logout: handleLogout,
        login: handleLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

```

# context\AuthDebugger.tsx

```tsx
// AuthDebugger.tsx
import React from "react";
import { useAuth } from "../context/AuthContext";

const AuthDebugger = () => {
  const { user, loading, isAuthenticated } = useAuth();

  // Get the token from sessionStorage to show in the debugger
  const storedData = sessionStorage.getItem("rht-user");
  let token = "None";
  let refreshToken = "None";

  if (storedData) {
    try {
      const parsed = JSON.parse(storedData);
      token = parsed.token ? `${parsed.token.slice(0, 15)}...` : "None";
      refreshToken = parsed.refreshToken
        ? `${parsed.refreshToken.slice(0, 15)}...`
        : "None";
    } catch (e) {
      console.error("Error parsing stored auth data:", e);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: "10px",
        right: "10px",
        background: "#f0f0f0",
        padding: "10px",
        border: "1px solid #ccc",
        borderRadius: "4px",
        zIndex: 9999,
        fontSize: "12px",
        maxWidth: "300px",
        overflow: "auto",
      }}
    >
      <h4>Auth Debugger</h4>
      <p>
        <strong>Loading:</strong> {loading ? "true" : "false"}
      </p>
      <p>
        <strong>Authenticated:</strong> {isAuthenticated ? "true" : "false"}
      </p>
      <p>
        <strong>User:</strong> {user ? user.username : "None"}
      </p>
      <p>
        <strong>Token:</strong> {token}
      </p>
      <p>
        <strong>Refresh Token:</strong> {refreshToken}
      </p>
      {user && (
        <pre style={{ fontSize: "10px" }}>{JSON.stringify(user, null, 2)}</pre>
      )}
      <button
        onClick={() => {
          const data = sessionStorage.getItem("rht-user");
          console.log("Session Storage:", data ? JSON.parse(data) : null);
          console.log("Auth Context User:", user);
        }}
        style={{ fontSize: "10px", padding: "2px 5px" }}
      >
        Debug Auth
      </button>
    </div>
  );
};

export default AuthDebugger;

```

# declarations.d.ts

```ts
declare module "*.svg" {
  import React from "react";
  const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>;
  export { ReactComponent };
  const src: string;
  export default src;
}

```

# hooks\index.ts

```ts
export { useAlbumStats } from "./useAlbumStats";
export { useGroupMembers } from "./useGroupMembers";
export { useUserGroups } from "./useUserGroups";

```

# hooks\useAlbumStats.ts

```ts
import { useState, useEffect, useCallback, useRef } from "react";
import { FiltersState, SongStat } from "../types/rhcp-types";
import { fetchWrapper } from "../services/api";
import { useAuth } from "../context/AuthContext";

export const useAlbumStats = (
  albumId: number,
  filters: FiltersState,
  reviewUpdateCount = 0
) => {
  const [stats, setStats] = useState<SongStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const isAuthenticated = !!user;

  // Use a ref to track the previous stats for better comparison
  const prevStatsRef = useRef<SongStat[]>([]);

  // Track local updates to user ratings that might not be reflected in the API yet
  const pendingUserRatingsRef = useRef<{ [songId: number]: number }>({});

  // Helper function to get auth headers
  const getAuthHeader = useCallback(() => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (user?.token) {
      headers["Authorization"] = `Bearer ${user.token}`;
    }

    return { headers };
  }, [user]);

  // Function to merge new stats with previous userRatings when appropriate
  const mergeWithPrevStats = useCallback((newStats: SongStat[]) => {
    // If we don't have previous stats, just use the new ones with any pending ratings
    if (!prevStatsRef.current.length) {
      return newStats.map((song) => {
        // Check if we have a pending rating for this song
        if (pendingUserRatingsRef.current[song.id]) {
          return {
            ...song,
            userRating: pendingUserRatingsRef.current[song.id],
          };
        }
        return song;
      });
    }

    // Create a map of previous stats by song ID for easy lookup
    const prevStatsBySongId = new Map(
      prevStatsRef.current.map((song) => [song.id, song])
    );

    // Merge new stats with previous userRatings and pending ratings
    return newStats.map((newSong) => {
      const prevSong = prevStatsBySongId.get(newSong.id);
      const pendingRating = pendingUserRatingsRef.current[newSong.id];

      // Start with the new song data
      let mergedSong = { ...newSong };

      // If we have a pending rating, that takes highest priority
      if (pendingRating !== undefined) {
        mergedSong.currentUserRating = pendingRating;
      }
      // If the new song has a currentUserRating, use that (API responded with our rating)
      else if (
        newSong.currentUserRating !== undefined &&
        newSong.currentUserRating !== null
      ) {
        mergedSong.currentUserRating = newSong.currentUserRating;
      }
      // If the new song doesn't have a currentUserRating but previous did, preserve it
      else if (
        prevSong &&
        prevSong.currentUserRating !== undefined &&
        prevSong.currentUserRating !== null
      ) {
        mergedSong.currentUserRating = prevSong.currentUserRating;
      }

      if (
        newSong.selectedUserRating !== undefined &&
        newSong.selectedUserRating !== null
      ) {
        mergedSong.selectedUserRating = newSong.selectedUserRating;
      }

      return mergedSong;
    });
  }, []);

  // Method to manually set a user rating locally
  // This can be called when a user submits a rating but before the API refresh
  const setUserRating = useCallback((songId: number, rating: number) => {
    console.log(`Setting local user rating for song ${songId} to ${rating}`);

    // Update the pending ratings ref
    pendingUserRatingsRef.current = {
      ...pendingUserRatingsRef.current,
      [songId]: rating,
    };

    // Also update the current stats state immediately for UI feedback
    setStats((currentStats) =>
      currentStats.map((song) =>
        song.id === songId ? { ...song, currentUserRating: rating } : song
      )
    );
  }, []);

  // Fetch album stats
  const fetchStats = useCallback(async () => {
    if (!albumId) return;

    try {
      setLoading(true);

      // Build query params for album stats
      const statsParams = new URLSearchParams();

      // Add group filter if applicable
      if (filters.groupId !== "all") {
        statsParams.append("groupId", filters.groupId);
      }

      // Add selected user filter if applicable
      if (filters.userId !== "all" && filters.userId !== String(user?.id)) {
        statsParams.append("selectedUserId", filters.userId);
      }

      if (isAuthenticated && user?.id) {
        statsParams.append("userId", String(user.id));
      }

      const apiUrl = `/albums/${albumId}/songs/stats`;
      const queryString = statsParams.toString();
      const fullUrl = queryString ? `${apiUrl}?${queryString}` : apiUrl;

      console.log(`Fetching stats from: ${fullUrl}`);

      try {
        const response = await fetchWrapper(fullUrl, getAuthHeader());

        // Ensure we have a valid response
        if (Array.isArray(response)) {
          // Process and validate the response data
          const validatedStats = response.map((song) => ({
            ...song,
            currentUserRating:
              typeof song.currentUserRating === "number"
                ? song.currentUserRating
                : null,
            selectedUserRating:
              typeof song.selectedUserRating === "number"
                ? song.selectedUserRating
                : null,
            publicAverage:
              typeof song.publicAverage === "number" ? song.publicAverage : 0,
            publicReviewCount:
              typeof song.publicReviewCount === "number"
                ? song.publicReviewCount
                : 0,
            groupAverage:
              typeof song.groupAverage === "number"
                ? song.groupAverage
                : song.groupAverage !== null && song.groupAverage !== undefined
                ? Number(song.groupAverage)
                : null,
            groupReviewCount:
              typeof song.groupReviewCount === "number"
                ? song.groupReviewCount
                : null,
          }));

          // Merge with previous stats to preserve user ratings if needed
          const mergedStats = mergeWithPrevStats(validatedStats);

          // Sort by track number for consistency
          const sortedStats = [...mergedStats].sort(
            (a, b) => a.trackNumber - b.trackNumber
          );

          // Update refs and state
          prevStatsRef.current = sortedStats;
          setStats(sortedStats);
          setError(null); // Clear error

          console.log(
            "Updated stats with user ratings:",
            sortedStats.map((s) => ({
              id: s.id,
              currentUserRating: s.currentUserRating,
            }))
          );
        } else {
          throw new Error("Invalid response format");
        }
      } catch (fetchError) {
        // If specific error with group/user filter, try falling back to public stats
        if (filters.groupId !== "all" || filters.userId !== "all") {
          try {
            // Fall back to public stats
            const publicResponse = await fetchWrapper(
              `/albums/${albumId}/songs/stats`,
              {
                headers: { "Content-Type": "application/json" },
              }
            );

            if (Array.isArray(publicResponse)) {
              const validatedStats = publicResponse.map((song) => ({
                ...song,
                averageRating:
                  typeof song.averageRating === "number"
                    ? song.averageRating
                    : 0,
                reviewCount:
                  typeof song.reviewCount === "number" ? song.reviewCount : 0,
                userRating:
                  typeof song.userRating === "number" ? song.userRating : null,
              }));

              // Apply any pending user ratings
              const mergedStats = mergeWithPrevStats(validatedStats);

              // Sort by track number for consistency
              const sortedStats = [...mergedStats].sort(
                (a, b) => a.trackNumber - b.trackNumber
              );

              prevStatsRef.current = sortedStats;
              setStats(sortedStats);
              setError(
                "Could not load filtered data. Showing public ratings instead."
              );
            } else {
              throw new Error("Invalid response format from public stats");
            }
          } catch (fallbackError) {
            throw fetchError; // Throw the original error if fallback fails
          }
        } else {
          throw fetchError;
        }
      }
    } catch (err) {
      console.error("Error fetching album stats:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load song statistics"
      );
    } finally {
      setLoading(false);
    }
  }, [
    albumId,
    filters,
    isAuthenticated,
    user,
    getAuthHeader,
    mergeWithPrevStats,
  ]);

  // Special effect to handle reviewUpdateCount changes
  useEffect(() => {
    if (reviewUpdateCount > 0) {
      console.log("Review update triggered - refreshing stats");
      fetchStats();
    }
  }, [reviewUpdateCount, fetchStats]);

  // Main effect to fetch stats when dependencies change
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refreshStats: fetchStats,
    setUserRating, // Export this so ReviewsTable can use it
  };
};

```

# hooks\useGroupMembers.ts

```ts
import { useState, useEffect } from "react";
import { GroupMember } from "../types/rhcp-types";
import { fetchGroupMembers } from "../services/groupService";

export const useGroupMembers = (groupId: string) => {
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMembers = async () => {
      // Skip fetching if "all" is selected
      if (groupId === "all") {
        setMembers([]);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Make sure we have a valid groupId
        if (!groupId) {
          setMembers([]);
          return;
        }

        const data = await fetchGroupMembers(groupId);
        setMembers(data);
      } catch (err: any) {
        console.error("Error in useGroupMembers:", err);
        setError(err.message || "Failed to load group members");
        setMembers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [groupId]);

  const refetch = async () => {
    if (groupId === "all") return;

    try {
      setLoading(true);
      setError(null);
      const data = await fetchGroupMembers(groupId);
      setMembers(data);
    } catch (err: any) {
      setError(err.message || "Failed to load group members");
    } finally {
      setLoading(false);
    }
  };

  return { members, loading, error, refetch };
};

```

# hooks\useReviewsManager.ts

```ts
import { useState, useEffect, useRef, useCallback } from "react";
import { SongStat, FiltersState, UserReview } from "../types/rhcp-types";
import { fetchWrapper } from "../services/api";

interface User {
  id: number;
  token?: string;
  username?: string;
  email?: string;
}

export const useReviewsManager = (
  songStats: SongStat[],
  filters: FiltersState,
  user: User | null | undefined,
  onReviewSubmitted?: () => void
) => {
  const isAuthenticated = !!user;

  // State management
  const expandedSongIdRef = useRef<number | null>(null);
  const [expandedSongId, setExpandedSongId] = useState<number | null>(null);

  const userReviewsRef = useRef<{ [key: number]: UserReview[] }>({});
  const [loadingReviews, setLoadingReviews] = useState<{
    [key: number]: boolean;
  }>({});

  const [currentRatings, setCurrentRatings] = useState<{
    [key: number]: number;
  }>({});
  const [reviewContents, setReviewContents] = useState<{
    [key: number]: string;
  }>({});
  const [submitting, setSubmitting] = useState<{ [key: number]: boolean }>({});
  const [successMessages, setSuccessMessages] = useState<{
    [key: number]: string;
  }>({});
  const [editingComments, setEditingComments] = useState<{
    [key: number]: boolean;
  }>({});
  const [error, setError] = useState<string | null>(null);

  const commentTimeouts = useRef<{ [key: number]: NodeJS.Timeout }>({});

  // Initialize ratings from songStats
  useEffect(() => {
    const ratings: { [key: number]: number } = {};

    songStats.forEach((song: SongStat) => {
      if (
        song.currentUserRating !== undefined &&
        song.currentUserRating !== null
      ) {
        ratings[song.id] = song.currentUserRating;
      }
    });

    if (Object.keys(ratings).length > 0) {
      setCurrentRatings(ratings);
    }
  }, [songStats]);

  // Load user reviews for all songs on component mount
  useEffect(() => {
    const loadUserReviews = async () => {
      if (!isAuthenticated || !user || !songStats.length) return;

      try {
        const songIds = songStats.map((song: SongStat) => song.id).join(",");
        const queryParams = new URLSearchParams({
          userId: user.id.toString(),
          songIds: songIds,
        });

        const response = await fetchWrapper(
          `/reviews/user/songs?${queryParams.toString()}`,
          getAuthHeader()
        );

        if (response && response.reviews && Array.isArray(response.reviews)) {
          const newRatings = { ...currentRatings };
          const newContents = { ...reviewContents };

          response.reviews.forEach((review: UserReview) => {
            newRatings[review.songId] = review.rating;
            newContents[review.songId] = review.content || "";
          });

          setCurrentRatings(newRatings);
          setReviewContents(newContents);
        }
      } catch (err) {
        console.error("Error fetching user reviews:", err);
      }
    };

    loadUserReviews();
  }, [songStats, user, isAuthenticated]);

  // Auth headers helper
  const getAuthHeader = useCallback(() => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (user?.token) {
      headers["Authorization"] = `Bearer ${user.token}`;
    }

    return { headers };
  }, [user]);

  // Handlers
  const handleExpand = useCallback(
    async (songId: number) => {
      if (expandedSongIdRef.current === songId) {
        expandedSongIdRef.current = null;
        setExpandedSongId(null);
        return;
      }

      expandedSongIdRef.current = songId;
      setExpandedSongId(songId);

      if (!userReviewsRef.current[songId]) {
        setLoadingReviews((prev) => ({ ...prev, [songId]: true }));

        try {
          const queryParams = new URLSearchParams({
            songId: songId.toString(),
          });

          if (filters.groupId !== "all") {
            queryParams.append("groupId", filters.groupId);
          }

          const response = await fetchWrapper(
            `/reviews/song?${queryParams.toString()}`,
            getAuthHeader()
          );

          userReviewsRef.current[songId] = response.reviews || [];

          // Force update so the component rerenders with reviews
          setLoadingReviews((prev) => ({ ...prev, [songId]: false }));

          // Find user's review if it exists
          if (isAuthenticated && user) {
            const userReview = response.reviews?.find(
              (review: UserReview) => review.userId === user.id
            );

            if (userReview) {
              setCurrentRatings((prev) => ({
                ...prev,
                [songId]: userReview.rating,
              }));
              setReviewContents((prev) => ({
                ...prev,
                [songId]: userReview.content || "",
              }));
            }
          }
        } catch (err) {
          console.error("Error fetching reviews:", err);
          setError("Failed to load reviews");
          setLoadingReviews((prev) => ({ ...prev, [songId]: false }));
        }
      }
    },
    [filters, isAuthenticated, user, getAuthHeader]
  );

  const handleRatingChange = useCallback(
    (songId: number, rating: number) => {
      const newRating = rating * 2; // Convert 5-star scale to 10-point scale

      // Update state without causing a complete re-render
      setCurrentRatings((prev) => {
        const updatedRatings = { ...prev };
        updatedRatings[songId] = newRating;
        return updatedRatings;
      });

      // Submit the review in the background
      submitReview(songId, newRating, reviewContents[songId] || "");
    },
    [reviewContents]
  );

  const handleContentChange = useCallback(
    (songId: number, content: string) => {
      setReviewContents((prev) => ({ ...prev, [songId]: content }));
      setEditingComments((prev) => ({ ...prev, [songId]: true }));

      // Clear any existing timeout
      if (commentTimeouts.current[songId]) {
        clearTimeout(commentTimeouts.current[songId]);
      }

      // Set a new timeout to submit after 1.5 seconds of inactivity
      commentTimeouts.current[songId] = setTimeout(() => {
        const rating = currentRatings[songId];
        if (rating) {
          submitReview(songId, rating, content);
          setEditingComments((prev) => ({ ...prev, [songId]: false }));
        }
      }, 1500);
    },
    [currentRatings]
  );

  const submitReview = async (
    songId: number,
    rating: number,
    content: string
  ) => {
    if (!isAuthenticated || !user) {
      setError("You must be logged in to submit a review");
      return;
    }

    setSubmitting((prev) => ({ ...prev, [songId]: true }));

    try {
      // Find if user already has a review
      const songData = songStats.find((s: SongStat) => s.id === songId);
      const hasExistingReview =
        songData?.currentUserRating !== undefined &&
        songData.currentUserRating !== null;

      if (rating === 0) {
        throw new Error("Please provide a rating");
      }

      const reviewData = {
        songId,
        rating,
        content: content || "",
        groupId: filters.groupId !== "all" ? parseInt(filters.groupId) : null,
      };

      // Find review ID if updating
      let reviewId = null;

      // If we have an existing review based on currentUserRating
      if (hasExistingReview) {
        // First check our cached reviews
        if (userReviewsRef.current[songId]) {
          const cachedReview = userReviewsRef.current[songId].find(
            (review) => review.userId === user.id
          );
          if (cachedReview) {
            reviewId = cachedReview.id;
          }
        }

        // If not found in cache, fetch it directly
        if (!reviewId) {
          try {
            console.log("Fetching review ID for:", songId);

            const response = await fetchWrapper(
              `/reviews/user/${user.id}/song/${songId}`,
              getAuthHeader()
            );

            if (response && response.review) {
              reviewId = response.review.id;
              console.log("Found review ID:", reviewId);

              // Update our cache with this review
              if (!userReviewsRef.current[songId]) {
                userReviewsRef.current[songId] = [];
              }

              // Only add if not already in the cache
              const exists = userReviewsRef.current[songId].some(
                (r) => r.id === response.review.id
              );
              if (!exists) {
                userReviewsRef.current[songId].push(response.review);
              }
            }
          } catch (err) {
            console.error("Error fetching review ID:", err);
            // Continue without the review ID - we'll create a new one
          }
        }
      }

      // Determine endpoint and method
      const method = reviewId ? "PUT" : "POST";
      const endpoint = reviewId ? `/reviews/${reviewId}` : "/reviews";

      console.log(`Submitting review: ${method} ${endpoint}`, {
        songId,
        reviewId,
        hasExistingReview,
      });

      const options = {
        ...getAuthHeader(),
        method,
        body: JSON.stringify(reviewData),
      };

      // Make the API request
      const response = await fetchWrapper(endpoint, options);

      // Show success message
      setSuccessMessages((prev) => ({
        ...prev,
        [songId]: hasExistingReview ? "Review updated!" : "Review submitted!",
      }));

      // Clear success message after 2 seconds
      setTimeout(() => {
        setSuccessMessages((prev) => {
          const newMessages = { ...prev };
          delete newMessages[songId];
          return newMessages;
        });
      }, 2000);

      // Maybe refresh stats or reviews if expanded
      if (response && response.id) {
        // Update our cache with this new/updated review
        if (response.id && !reviewId) {
          // This was a new review - store it
          if (!userReviewsRef.current[songId]) {
            userReviewsRef.current[songId] = [];
          }

          // Add or update the review in our cache
          const reviewIndex = userReviewsRef.current[songId].findIndex(
            (r) => r.id === response.id
          );
          if (reviewIndex >= 0) {
            userReviewsRef.current[songId][reviewIndex] = response;
          } else {
            userReviewsRef.current[songId].push(response);
          }
        }

        // Call the callback to refresh stats
        if (onReviewSubmitted) {
          onReviewSubmitted();
        }

        // Only refresh expanded reviews
        if (expandedSongIdRef.current === songId) {
          const queryParams = new URLSearchParams({
            songId: songId.toString(),
          });

          if (filters.groupId !== "all") {
            queryParams.append("groupId", filters.groupId);
          }

          const reviewsResponse = await fetchWrapper(
            `/reviews/song?${queryParams.toString()}`,
            getAuthHeader()
          );

          userReviewsRef.current[songId] = reviewsResponse.reviews || [];
          // Force re-render for the reviews list
          setSubmitting((prev) => ({ ...prev }));
        }
      }
    } catch (err) {
      console.error("Error submitting review:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting((prev) => ({ ...prev, [songId]: false }));
    }
  };

  return {
    expandedSongId,
    userReviewsRef,
    loadingReviews,
    currentRatings,
    reviewContents,
    submitting,
    successMessages,
    editingComments,
    error,
    setError,
    handleExpand,
    handleRatingChange,
    handleContentChange,
  };
};

```

# hooks\useUserGroups.ts

```ts
import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchUserGroups } from "../services/groupService";
import { Group } from "../types/rhcp-types";

export const useUserGroups = (userId?: number) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Store the last fetched userId to prevent redundant requests
  const lastFetchedRef = useRef<number | null>(null);

  useEffect(() => {
    // Skip if no userId provided and no logged-in user
    if (!userId && !user?.id) {
      setGroups([]);
      setLoading(false);
      return;
    }

    // Determine which ID to use (provided ID or logged in user)
    const targetUserId = userId || user?.id;

    if (!targetUserId) {
      setGroups([]);
      setLoading(false);
      return;
    }

    // Skip if we already fetched data for this userId
    if (lastFetchedRef.current === targetUserId) {
      return;
    }

    const fetchGroups = async () => {
      try {
        setLoading(true);
        setError(null);

        // Call the service function with the targetUserId
        console.log(`Fetching groups for user ID: ${targetUserId}`);
        const groupsData = await fetchUserGroups(targetUserId);
        lastFetchedRef.current = targetUserId;

        // Check if we got an array back
        if (Array.isArray(groupsData)) {
          setGroups(groupsData);
        } else {
          console.warn("Unexpected response format:", groupsData);
          setGroups([]);
        }
      } catch (err: any) {
        console.error("Error fetching user groups:", err);
        setError("Unable to load groups at this time");
        setGroups([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, [userId, user?.id]); // Simplified dependencies

  // Add a manual refresh function
  const refreshGroups = useCallback(() => {
    // Reset the lastFetchedRef to force a new fetch
    lastFetchedRef.current = null;

    // Skip if no userId provided and no logged-in user
    if (!userId && !user?.id) return;

    const targetUserId = userId || user?.id;
    if (!targetUserId) return;

    setLoading(true);
    fetchUserGroups(targetUserId)
      .then((groupsData) => {
        if (Array.isArray(groupsData)) {
          setGroups(groupsData);
        } else {
          setGroups([]);
        }
        lastFetchedRef.current = targetUserId;
      })
      .catch((err) => {
        console.error("Error refreshing groups:", err);
        setError("Unable to refresh groups at this time");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [userId, user?.id]);

  return { groups, loading, error, refreshGroups };
};

```

# index.tsx

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styling/Styles.css";
import "./styling/theme.css";
import "./utils/chartConfig";

const rootElement = document.getElementById("root");

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error("Root element not found!");
}

```

# layouts\MainLayout.tsx

```tsx
import { Outlet } from "react-router-dom";
// import Header from '../components/common/Header';
import Footer from "../components/common/Footer";

const MainLayout = () => (
  <div className="min-h-screen flex flex-col">
    {/* <Header /> */}
    <main className="flex-grow">
      <Outlet />
    </main>
    <Footer />
  </div>
);

```

# pages\CreateGroup.tsx

```tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createGroup } from "../services/groupService";
import BaseContainer from "../components/common/Container";
import Navbar from "../components/common/Navbar";

const CreateGroupPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isPrivate: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setFormData({
      ...formData,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    });
  };

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();

    // Basic validation
    if (!formData.name.trim()) {
      setError("Group name is required");
      return;
    }

    if (formData.name.trim().length < 2) {
      setError("Group name must be at least 2 characters");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await createGroup(formData);

      // Navigate to the newly created group page
      navigate(`/groups/${response.id}`);
    } catch (err) {
      console.error("Error creating group:", err);
      setError(err instanceof Error ? err.message : "Failed to create group");
      setLoading(false);
    }
  };

  return (
    <BaseContainer>
      <Navbar />
      <div className="max-w-2xl mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Create New Group</h1>
          <button
            onClick={() => navigate("/groups")}
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                className="block text-gray-700 font-medium mb-2"
                htmlFor="name"
              >
                Group Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div className="mb-4">
              <label
                className="block text-gray-700 font-medium mb-2"
                htmlFor="description"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="What is this group about?"
              />
            </div>

            <div className="mb-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPrivate"
                  name="isPrivate"
                  checked={formData.isPrivate}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-gray-700" htmlFor="isPrivate">
                  Make this group private
                </label>
              </div>
              <p className="text-gray-500 text-sm mt-1 ml-6">
                Private groups require an invitation to join
              </p>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Group"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </BaseContainer>
  );
};

export default CreateGroupPage;

```

# pages\ForgotPassword.tsx

```tsx
import { useState } from "react";
import { sendPasswordResetEmail } from "../services/authService";
import { ReactComponent as Logo } from "../assets/rht-logo.svg";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    try {
      await sendPasswordResetEmail(email);
      setStatus("sent");
    } catch {
      setStatus("error");
    }
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
          Forgot Password
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="forEmail" className="block text-sm mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="forEmail"
              className="py-3 px-4 block w-full border rounded-sm text-sm focus:border-cornell-red focus:ring-0"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="grid my-6">
            <button
              type="submit"
              className="w-full py-3 px-4 bg-cornell-red-2 text-white-smoke hover:bg-blood-red font-medium rounded-sm transition-colors"
            >
              {status === "sending" ? "Sending..." : "Send Reset Link"}
            </button>
          </div>

          {status === "sent" && (
            <p className="text-green-600 text-center">Email sent!</p>
          )}
          {status === "error" && (
            <p className="text-imperial-red text-center">
              Error sending email.
            </p>
          )}

          <div className="flex justify-center gap-2 items-center mt-4">
            <p className="text-base font-semibold text-silver">
              Remembered your password?
            </p>
            <a
              href="/login"
              className="text-sm font-semibold hover:text-blood-red"
            >
              Sign In
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;

```

# pages\GroupDetail.tsx

```tsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  fetchGroupDetails,
  fetchGroupMembers,
  sendGroupInvite,
} from "../services/groupService";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/common/Navbar";
import BaseContainer from "../components/common/Container";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { Group, GroupMember } from "../types/rhcp-types";

const GroupDetailPage = () => {
  const { groupId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  const isAdmin = group?.role === "admin";

  useEffect(() => {
    const loadGroupData = async () => {
      if (!groupId) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch group details
        const groupData = await fetchGroupDetails(groupId);
        setGroup(groupData);

        // Fetch group members
        const membersData = await fetchGroupMembers(groupId);
        setMembers(membersData);
      } catch (err) {
        console.error("Error loading group data:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load group data"
        );
      } finally {
        setLoading(false);
      }
    };

    loadGroupData();
  }, [groupId]);

  const handleInviteUser = async (e: { preventDefault: () => void }) => {
    e.preventDefault();

    if (!email.trim()) {
      setInviteError("Please enter an email address");
      return;
    }

    if (!isAdmin) {
      setInviteError("Only group admins can send invites");
      return;
    }

    try {
      setInviteLoading(true);
      setInviteError(null);
      setInviteSuccess(false);

      await sendGroupInvite(groupId!, email.trim());

      // Clear email and show success message
      setEmail("");
      setInviteSuccess(true);

      // Hide success message after 3 seconds
      setTimeout(() => setInviteSuccess(false), 3000);
    } catch (err) {
      console.error("Error inviting user:", err);
      setInviteError(
        err instanceof Error ? err.message : "Failed to send invitation"
      );
    } finally {
      setInviteLoading(false);
    }
  };

  if (loading)
    return (
      <BaseContainer>
        <Navbar />
        <div className="max-w-6xl mx-auto p-4">
          <LoadingSpinner />
        </div>
      </BaseContainer>
    );

  if (error)
    return (
      <BaseContainer>
        <Navbar />
        <div className="max-w-6xl mx-auto p-4">
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
            {error}
          </div>
          <button
            onClick={() => navigate("/groups")}
            className="mt-4 bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
          >
            Back to Groups
          </button>
        </div>
      </BaseContainer>
    );

  if (!group)
    return (
      <BaseContainer>
        <Navbar />
        <div className="max-w-6xl mx-auto p-4">
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-4 rounded-md">
            Group not found
          </div>
          <button
            onClick={() => navigate("/groups")}
            className="mt-4 bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
          >
            Back to Groups
          </button>
        </div>
      </BaseContainer>
    );

  return (
    <BaseContainer>
      <div className="flex flex-col bg-white items-center justify-center px-4">
        <Navbar />
        <div className="w-full max-w-7xl mx-auto p-4 bg-white">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">{group.name}</h1>
            <button
              onClick={() => navigate("/groups")}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
            >
              Back to Groups
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Group Info */}
            <div className="bg-white rounded-lg shadow-md p-4 md:col-span-1">
              {group.image ? (
                <img
                  src={group.image}
                  alt={group.name}
                  className="w-full h-48 object-cover rounded-md mb-3"
                />
              ) : (
                <div className="w-full h-48 bg-gray-200 rounded-md mb-3 flex items-center justify-center">
                  <span className="text-gray-500 text-4xl">
                    {group.name.substring(0, 1)}
                  </span>
                </div>
              )}
              <p className="text-gray-600 mb-4">
                {group.description || "No description"}
              </p>
              <div className="flex justify-between text-sm text-gray-500">
                <span>{members.length} members</span>
                <span
                  className={`uppercase ${
                    group.isPrivate
                      ? "bg-red-100 text-red-800"
                      : "bg-green-100 text-green-800"
                  } px-2 py-1 rounded-full`}
                >
                  {group.isPrivate ? "Private" : "Public"}
                </span>
              </div>
              <div className="mt-2 text-sm">
                <span className="font-medium">Your role:</span>
                <span className="uppercase bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full ml-2">
                  {group.role}
                </span>
              </div>

              {/* Invite Code (for private groups) */}
              {group.isPrivate && (
                <div className="mt-4 p-3 bg-gray-50 rounded-md border border-gray-200">
                  <h3 className="text-sm font-medium mb-2">
                    Group Invite Code
                  </h3>
                  <div className="flex items-center">
                    <code className="bg-gray-100 p-2 rounded text-sm flex-grow overflow-x-auto">
                      {group.inviteCode}
                    </code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(group.inviteCode);
                        alert("Invite code copied to clipboard!");
                      }}
                      className="ml-2 p-2 bg-indigo-100 text-indigo-800 rounded hover:bg-indigo-200"
                    >
                      Copy
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Share this code with others to invite them to the group
                  </p>
                </div>
              )}
            </div>

            {/* Group Members & Invite Form */}
            <div className="md:col-span-2">
              {/* Invite Users (admins only) */}
              {isAdmin && group.isPrivate && (
                <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                  <h2 className="text-lg font-medium mb-3">Invite Users</h2>
                  <form
                    onSubmit={handleInviteUser}
                    className="flex items-center"
                  >
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter email address"
                      className="flex-grow p-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="submit"
                      disabled={inviteLoading}
                      className="bg-indigo-600 text-white p-2 rounded-r-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      {inviteLoading ? "Sending..." : "Send Invite"}
                    </button>
                  </form>
                  {inviteError && (
                    <p className="text-red-500 mt-2 text-sm">{inviteError}</p>
                  )}
                  {inviteSuccess && (
                    <p className="text-green-500 mt-2 text-sm">
                      Invitation sent successfully!
                    </p>
                  )}
                </div>
              )}

              {/* Members List */}
              <div className="bg-white rounded-lg shadow-md p-4">
                <h2 className="text-lg font-medium mb-3">
                  Members ({members.length})
                </h2>
                <div className="divide-y divide-gray-200">
                  {members.map((member: GroupMember) => (
                    <div
                      key={member.id}
                      className="py-3 flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        {member.image ? (
                          <img
                            src={member.image}
                            alt={member.username}
                            className="w-10 h-10 rounded-full mr-3"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-200 rounded-full mr-3 flex items-center justify-center">
                            <span className="text-gray-500">
                              {member.username.substring(0, 1)}
                            </span>
                          </div>
                        )}
                        <div>
                          <h3 className="font-medium">
                            {member.username}
                            {member.id === user?.id && (
                              <span className="text-gray-500 text-sm ml-2">
                                (You)
                              </span>
                            )}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {member.email}
                          </p>
                        </div>
                      </div>
                      <div className="text-xs uppercase bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">
                        {member.role}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BaseContainer>
  );
};

export default GroupDetailPage;

```

# pages\Groups.tsx

```tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchMyGroups,
  joinGroup,
  fetchPublicGroups,
} from "../services/groupService";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/common/Navbar";
import BaseContainer from "../components/common/Container";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { Group } from "../types/rhcp-types";

const GroupsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [myGroups, setMyGroups] = useState([]);
  const [publicGroups, setPublicGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinSuccess, setJoinSuccess] = useState(false);

  useEffect(() => {
    const loadGroups = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch user's groups
        if (user) {
          const userGroups = await fetchMyGroups();
          setMyGroups(userGroups);
        }

        // Fetch public groups
        const pubGroups = await fetchPublicGroups();
        setPublicGroups(pubGroups);
      } catch (err) {
        console.error("Error loading groups:", err);
        setError(err instanceof Error ? err.message : "Failed to load groups");
      } finally {
        setLoading(false);
      }
    };

    loadGroups();
  }, [user]);

  const handleJoinGroup = async (e: { preventDefault: () => void }) => {
    e.preventDefault();

    if (!inviteCode.trim()) {
      setJoinError("Please enter an invite code");
      return;
    }

    try {
      setJoinLoading(true);
      setJoinError(null);
      setJoinSuccess(false);

      await joinGroup(inviteCode.trim());

      // Refresh groups after joining
      const userGroups = await fetchMyGroups();
      setMyGroups(userGroups);

      // Clear the invite code and show success message
      setInviteCode("");
      setJoinSuccess(true);

      // Hide success message after 3 seconds
      setTimeout(() => setJoinSuccess(false), 3000);
    } catch (err) {
      console.error("Error joining group:", err);
      setJoinError(err instanceof Error ? err.message : "Failed to join group");
    } finally {
      setJoinLoading(false);
    }
  };

  const navigateToGroupDetail = (groupId: number) => {
    navigate(`/groups/${groupId}`);
  };

  return (
    <BaseContainer>
      {" "}
      <div className="flex flex-col bg-white items-center justify-center px-4">
        <Navbar />{" "}
        <div className="w-full max-w-7xl mx-auto p-4 bg-white">
          <h1 className="text-2xl font-bold mb-6">Groups</h1>

          {/* Join Group with Invite Code */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <h2 className="text-lg font-medium mb-3">Join a Private Group</h2>
            <form onSubmit={handleJoinGroup} className="flex items-center">
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="Enter invite code"
                className="flex-grow p-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={joinLoading}
                className="bg-indigo-600 text-white p-2 rounded-r-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {joinLoading ? "Joining..." : "Join Group"}
              </button>
            </form>
            {joinError && (
              <p className="text-red-500 mt-2 text-sm">{joinError}</p>
            )}
            {joinSuccess && (
              <p className="text-green-500 mt-2 text-sm">
                Successfully joined group!
              </p>
            )}
          </div>

          {loading ? (
            <LoadingSpinner />
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
              {error}
            </div>
          ) : (
            <>
              {/* My Groups */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">My Groups</h2>
                {myGroups.length === 0 ? (
                  <p className="text-gray-500 italic">
                    You haven't joined any groups yet.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {myGroups.map((group: Group) => (
                      <div
                        key={group.id}
                        onClick={() => navigateToGroupDetail(group.id)}
                        className="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow"
                      >
                        {group.image ? (
                          <img
                            src={group.image}
                            alt={group.name}
                            className="w-full h-32 object-cover rounded-md mb-3"
                          />
                        ) : (
                          <div className="w-full h-32 bg-gray-200 rounded-md mb-3 flex items-center justify-center">
                            <span className="text-gray-500">
                              {group.name.substring(0, 1)}
                            </span>
                          </div>
                        )}
                        <h3 className="text-lg font-medium">{group.name}</h3>
                        <p className="text-gray-600 text-sm">
                          {group.description || "No description"}
                        </p>
                        <div className="mt-2 flex justify-between text-xs text-gray-500">
                          <span>{group.memberCount} members</span>
                          <span className="uppercase bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">
                            {group.role}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Public Groups */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Public Groups</h2>
                {publicGroups.length === 0 ? (
                  <p className="text-gray-500 italic">
                    No public groups available.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {publicGroups.map((group: Group) => {
                      // Check if user is already a member of this group
                      const isMember = myGroups.some(
                        (g: Group) => g.id === group.id
                      );

                      return (
                        <div
                          key={group.id}
                          className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
                        >
                          {group.image ? (
                            <img
                              src={group.image}
                              alt={group.name}
                              className="w-full h-32 object-cover rounded-md mb-3"
                            />
                          ) : (
                            <div className="w-full h-32 bg-gray-200 rounded-md mb-3 flex items-center justify-center">
                              <span className="text-gray-500">
                                {group.name.substring(0, 1)}
                              </span>
                            </div>
                          )}
                          <h3 className="text-lg font-medium">{group.name}</h3>
                          <p className="text-gray-600 text-sm">
                            {group.description || "No description"}
                          </p>
                          <div className="mt-2 flex justify-between items-center">
                            <span className="text-xs text-gray-500">
                              {group.memberCount} members
                            </span>
                            {isMember ? (
                              <button
                                onClick={() => navigateToGroupDetail(group.id)}
                                className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded hover:bg-green-200"
                              >
                                View Group
                              </button>
                            ) : (
                              <button
                                onClick={async () => {
                                  try {
                                    setJoinLoading(true);
                                    await joinGroup(group.id.toString(), true); // true flag for public group join
                                    // Refresh groups
                                    const userGroups = await fetchMyGroups();
                                    setMyGroups(userGroups);
                                  } catch (err) {
                                    console.error(
                                      "Error joining public group:",
                                      err
                                    );
                                    setJoinError(
                                      err instanceof Error
                                        ? err.message
                                        : "Failed to join group"
                                    );
                                  } finally {
                                    setJoinLoading(false);
                                  }
                                }}
                                disabled={joinLoading}
                                className="text-sm bg-indigo-100 text-indigo-800 px-3 py-1 rounded hover:bg-indigo-200 disabled:opacity-50"
                              >
                                {joinLoading ? "Joining..." : "Join Group"}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </BaseContainer>
  );
};

export default GroupsPage;

```

# pages\Home.tsx

```tsx
import { useState, useEffect } from "react";
import BaseContainer from "../components/common/Container";
import SongStats from "../components/SongStats/SongStats";
import Footer from "../components/common/Footer";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { useAuth } from "../context/AuthContext";
import { useUserGroups } from ".././hooks/useUserGroups";
import Navbar from "../components/common/Navbar";

const HomePage = () => {
  const { user, loading: authLoading } = useAuth();
  const [selectedAlbum, setSelectedAlbum] = useState<{
    id: number | null;
    title: string;
  }>({
    id: null,
    title: "",
  });

  const {
    groups,
    loading: groupsLoading,
    error: groupsError,
  } = useUserGroups(user?.id);

  // Check for album ID in URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const albumIdParam = params.get("albumId");

    if (albumIdParam && !selectedAlbum.id) {
      // Fetch album details if we have an ID in URL
      const fetchAlbumDetails = async () => {
        try {
          const response = await fetch(
            `http://localhost:5000/api/albums/${albumIdParam}`
          );
          if (response.ok) {
            const album = await response.json();
            setSelectedAlbum({
              id: parseInt(albumIdParam),
              title: album.title || "Album",
            });
          }
        } catch (error) {
          console.error("Error fetching album details:", error);
        }
      };

      fetchAlbumDetails();
    } else if (!selectedAlbum.id) {
      // Default to first album if none selected
      const fetchFirstAlbum = async () => {
        try {
          const response = await fetch("http://localhost:5000/api/albums");
          const data = await response.json();
          if (data.data && data.data.length > 0) {
            const firstAlbum = data.data[0];
            setSelectedAlbum({
              id: firstAlbum.id,
              title: firstAlbum.title,
            });
          }
        } catch (error) {
          console.error("Error fetching albums:", error);
        }
      };

      fetchFirstAlbum();
    }
  }, [selectedAlbum.id]);

  // Update URL when album changes
  useEffect(() => {
    if (selectedAlbum.id) {
      const url = new URL(window.location.href);
      url.searchParams.set("albumId", selectedAlbum.id.toString());
      window.history.replaceState({}, "", url.toString());
    }
  }, [selectedAlbum.id]);

  return (
    <>
      <BaseContainer>
        <div className="flex flex-col bg-white items-center justify-center px-4">
          <Navbar />
          <div className="w-full max-w-7xl mx-auto p-4 bg-white">
            {groupsLoading || authLoading ? (
              <LoadingSpinner />
            ) : groupsError ? (
              <div className="text-red-600">
                Error loading groups: {groupsError}
              </div>
            ) : (
              <SongStats
                albumId={selectedAlbum.id ?? 0}
                albumTitle={selectedAlbum.title}
                userId={user?.id?.toString() || ""}
                groups={groups || []}
              />
            )}

            <Footer />
          </div>
        </div>
      </BaseContainer>
    </>
  );
};

export default HomePage;

```

# pages\Login.tsx

```tsx
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

```

# pages\MyProfile.tsx

```tsx
import { useState, useEffect } from "react";
import BaseContainer from "../components/common/Container";
import SongStats from "../components/SongStats/SongStats";
import Footer from "../components/common/Footer";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { useAuth } from "../context/AuthContext";
import { useUserGroups } from ".././hooks/useUserGroups";
import Navbar from "../components/common/Navbar";
import MyProfile from "../components/Profile/MyProfile";

const HomePage = () => {
  const { user, loading: authLoading } = useAuth();
  const [selectedAlbum, setSelectedAlbum] = useState<{
    id: number | null;
    title: string;
  }>({
    id: null,
    title: "",
  });

  const {
    groups,
    loading: groupsLoading,
    error: groupsError,
  } = useUserGroups(user?.id);

  // Check for album ID in URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const albumIdParam = params.get("albumId");

    if (albumIdParam && !selectedAlbum.id) {
      // Fetch album details if we have an ID in URL
      const fetchAlbumDetails = async () => {
        try {
          const response = await fetch(
            `http://localhost:5000/api/albums/${albumIdParam}`
          );
          if (response.ok) {
            const album = await response.json();
            setSelectedAlbum({
              id: parseInt(albumIdParam),
              title: album.title || "Album",
            });
          }
        } catch (error) {
          console.error("Error fetching album details:", error);
        }
      };

      fetchAlbumDetails();
    } else if (!selectedAlbum.id) {
      // Default to first album if none selected
      const fetchFirstAlbum = async () => {
        try {
          const response = await fetch("http://localhost:5000/api/albums");
          const data = await response.json();
          if (data.data && data.data.length > 0) {
            const firstAlbum = data.data[0];
            setSelectedAlbum({
              id: firstAlbum.id,
              title: firstAlbum.title,
            });
          }
        } catch (error) {
          console.error("Error fetching albums:", error);
        }
      };

      fetchFirstAlbum();
    }
  }, [selectedAlbum.id]);

  // Update URL when album changes
  useEffect(() => {
    if (selectedAlbum.id) {
      const url = new URL(window.location.href);
      url.searchParams.set("albumId", selectedAlbum.id.toString());
      window.history.replaceState({}, "", url.toString());
    }
  }, [selectedAlbum.id]);

  return (
    <>
      <BaseContainer>
        <div className="flex flex-col bg-white items-center justify-center px-4">
          <Navbar />
          <div className="w-full max-w-7xl mx-auto p-4 bg-white">
            {groupsLoading || authLoading ? (
              <LoadingSpinner />
            ) : groupsError ? (
              <div className="text-red-600">
                Error loading groups: {groupsError}
              </div>
            ) : (
              <MyProfile />
            )}

            <Footer />
          </div>
        </div>
      </BaseContainer>
    </>
  );
};

export default HomePage;

```

# pages\Register.tsx

```tsx
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

```

# pages\ResetPassword.tsx

```tsx
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

```

# services\albumService.ts

```ts
import axios from "axios";
import { getCurrentUser } from "./authService";
import { SongStat } from "../types/rhcp-types";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000/api";

/**
 * Get statistics for songs in an album
 */
export const getAlbumStats = async (
  albumId: number,
  params: any
): Promise<SongStat[]> => {
  try {
    // Get current user token
    const user = getCurrentUser();

    // Create headers with auth token
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Only add Authorization header if we have a token
    if (user?.token) {
      headers["Authorization"] = `Bearer ${user.token}`;
      console.log(`Using auth token: ${user.token.substring(0, 10)}...`);
    }

    // Build query parameters
    const queryParams = new URLSearchParams();

    if (params.groupId && params.groupId !== "all") {
      queryParams.append("groupId", params.groupId.toString());
    }

    if (params.userId && params.userId !== "all") {
      queryParams.append("userId", params.userId.toString());
    }

    // Build URL - Make sure this matches your backend route definition exactly
    // Check if it should be '/albums/:albumId/songs/stats' or '/:albumId/songs/stats'
    let url = `${API_BASE}/albums/${albumId}/songs/stats`;
    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`;
    }

    console.log(`Requesting album stats from: ${url}`);

    // For debugging: log the exact route your backend expects
    console.log(
      "Your backend should have a route like: router.get('/:albumId/songs/stats', ...)"
    );

    const response = await axios.get<SongStat[]>(url, { headers });
    return response.data;
  } catch (error: any) {
    console.error(`Error fetching album stats for album ${albumId}:`, error);

    // More detailed error logging for debugging
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
      console.error("Response headers:", error.response.headers);
    } else if (error.request) {
      console.error("No response received, request:", error.request);
    } else {
      console.error("Error message:", error.message);
    }

    // Generic error
    throw new Error("Failed to load song statistics");
  }
};

/**
 * Fallback to get public album stats when group access fails
 */
const getPublicAlbumStats = async (albumId: number): Promise<SongStat[]> => {
  try {
    // Make a request for public stats only (no groupId)
    const url = `${API_BASE}/albums/${albumId}/songs/stats`;
    console.log(`Falling back to public stats: ${url}`);

    const response = await axios.get<SongStat[]>(url);
    return response.data;
  } catch (error) {
    console.error(
      `Error fetching public album stats for album ${albumId}:`,
      error
    );
    throw new Error("Failed to load song statistics");
  }
};

```

# services\api.ts

```ts
const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000/api";

export const fetchWrapper = async (url: string, options?: RequestInit) => {
  const response = await fetch(`${API_BASE}${url}`, options);
  if (!response.ok) throw new Error(response.statusText);
  return response.json();
};

```

# services\authService.ts

```ts
import DOMPurify from "dompurify";
import { AuthFormData, AuthResponse, User } from "../types/auth-types";
import axios from "axios";
import { fetchWrapper } from "./api";

// Configure secure axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE || "http://localhost:5000/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
});
export const setAuthHeader = (token: string) => {
  if (!token) return;

  // Set for api instance
  api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  // Also set for global axios
  axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
};

// XSS sanitization helper
const sanitizeInput = (data: unknown) =>
  JSON.parse(DOMPurify.sanitize(JSON.stringify(data)));

export const register = async (data: AuthFormData) => {
  const sanitizedData = sanitizeInput(data);
  return api.post<AuthResponse>("/auth/register", sanitizedData);
};

export const login = async (email: string, password: string) => {
  const sanitizedEmail = sanitizeInput(email);
  const sanitizedPassword = sanitizeInput(password);

  const response = await api.post<AuthResponse>("/auth/login", {
    email: sanitizedEmail,
    password: sanitizedPassword,
  });

  return response;
};

export const logout = () => {
  console.log("Logging out and clearing auth data");
  sessionStorage.removeItem("rht-user");
  // Clear token from axios defaults
  delete api.defaults.headers.common["Authorization"];
};

// Secure storage with sessionStorage - IMPROVED VERSION
export const storeAuthData = (userData: AuthResponse) => {
  if (!userData.token) {
    console.error("Cannot store auth data: no token provided");
    return;
  }

  try {
    const storageData = {
      id: userData.user.id,
      email: userData.user.email,
      username: userData.user.username,
      avatarColor: userData.user.avatarColor,
      image: userData.user.image,
      token: userData.token,
      refreshToken: userData.refreshToken,
    };

    console.log(
      "Storing auth data with token:",
      userData.token.substring(0, 15) + "..."
    );
    sessionStorage.setItem("rht-user", JSON.stringify(storageData));

    // Set the token for future API calls
    api.defaults.headers.common["Authorization"] = `Bearer ${userData.token}`;
    console.log("Set Authorization header for future API calls");
  } catch (error) {
    console.error("Error storing auth data:", error);
  }
};

// Get current user from session storage - IMPROVED VERSION
export const getCurrentUser = () => {
  try {
    const userData = sessionStorage.getItem("rht-user");
    if (!userData) {
      console.log("No user data found in session storage");
      return null;
    }

    try {
      const parsed = JSON.parse(userData);

      // Validate parsed user data
      if (!parsed.id || !parsed.token) {
        console.error("Invalid user data structure in storage:", parsed);
        return null;
      }

      // Set the token for API calls if a valid user is found
      if (parsed.token) {
        api.defaults.headers.common["Authorization"] = `Bearer ${parsed.token}`;
        console.log(
          "Retrieved token from storage:",
          parsed.token.substring(0, 15) + "..."
        );
      }

      return parsed;
    } catch (error) {
      console.error("Invalid user data", error);
      sessionStorage.removeItem("rht-user"); // Clean up invalid data
      return null;
    }
  } catch (error) {
    console.error("Error retrieving current user:", error);
    return null;
  }
};

export const updateUser = async (data: {
  username?: string;
  email?: string;
  password?: string;
  image?: string;
  avatarColor?: string;
}) => {
  const sanitizedData = sanitizeInput(data);
  const response = await api.patch("/auth/me", sanitizedData);
  const updatedUser = response.data;
  const current = getCurrentUser();
  if (current && updatedUser) {
    storeAuthData({
      user: {
        ...current,
        ...updatedUser,
      },
      token: current.token,
      refreshToken: current.refreshToken,
    });
  }

  return response.data;
};

// Function to check if the token is valid
export const checkStoredToken = () => {
  try {
    // Get the user data from session storage
    const userData = sessionStorage.getItem("rht-user");
    if (!userData) {
      console.warn("No user data in session storage");
      return false;
    }

    // Parse the user data
    const parsedData = JSON.parse(userData);

    // Check if token exists
    if (!parsedData.token) {
      console.warn("No token in stored user data");
      return false;
    }

    // Check token format (should be a JWT - three parts separated by dots)
    const tokenParts = parsedData.token.split(".");
    if (tokenParts.length !== 3) {
      console.warn("Token does not appear to be a valid JWT format");
      return false;
    }

    // Log token info for debugging
    console.log("Token exists and appears to be valid format");
    console.log(
      "Token starts with:",
      parsedData.token.substring(0, 15) + "..."
    );

    // Try to decode the JWT payload (middle part)
    try {
      const payload = JSON.parse(atob(tokenParts[1]));
      const expiry = payload.exp ? new Date(payload.exp * 1000) : null;

      console.log("Token payload:", payload);
      if (expiry) {
        console.log("Token expires:", expiry);
        console.log("Token expired?", expiry < new Date());
      }
    } catch (e) {
      console.warn("Could not decode token payload");
    }

    return true;
  } catch (error) {
    console.error("Error checking stored token:", error);
    return false;
  }
};

// Function to fetch the current user from the API
export const fetchCurrentUser = async (): Promise<User> => {
  try {
    // Add token from session storage
    const user = getCurrentUser();
    if (user?.token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${user.token}`;
      console.log("Set Authorization header for /me request");
    } else {
      console.warn("No token available for /me request");
    }

    console.log("Fetching current user from API");
    const response = await api.get<User>("/auth/me");
    console.log("Current user fetched successfully:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("Error fetching current user:", error.message);

    if (error.response?.status === 401) {
      console.log("401 Unauthorized, attempting token refresh");
      // Try to refresh the token
      const refreshSuccess = await refreshAuthToken();
      if (refreshSuccess) {
        console.log("Token refresh successful, retrying /me request");
        // Retry with the new token
        const response = await api.get<User>("/auth/me");
        return response.data;
      }
    }
    throw error;
  }
};

// Token refresh logic
export const refreshAuthToken = async () => {
  try {
    const user = getCurrentUser();
    if (!user?.refreshToken) throw new Error("No refresh token");

    const response = await api.post<{
      token: string;
      refreshToken: string;
    }>("/auth/refresh", {
      refreshToken: user.refreshToken,
    });

    // Store both new tokens
    storeAuthData({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        image: user.image,
        avatarColor: user.avatarColor,
      },
      token: response.data.token,
      refreshToken: response.data.refreshToken,
    });

    return true;
  } catch (error) {
    console.error("Token refresh failed:", error);
    logout();
    return false;
  }
};

// Set up response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If received 401 and we haven't tried refreshing yet
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      originalRequest.url !== "/auth/refresh" // Prevent infinite loop
    ) {
      originalRequest._retry = true;

      try {
        const refreshSuccess = await refreshAuthToken();
        if (refreshSuccess) {
          // Update the token in the original request
          const user = getCurrentUser();
          if (user?.token) {
            originalRequest.headers["Authorization"] = `Bearer ${user.token}`;
          }
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error("Token refresh error:", refreshError);
        logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const sendPasswordResetEmail = async (email: string) => {
  try {
    console.log(`Sending forgot password email to ${email}`);
    const options: RequestInit = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }), // include the email in the POST body
    };
    console.log(options);

    const response = await fetchWrapper(`/auth/forgot-password`, options);
    return response.data;
  } catch (error) {
    console.error(`Error with forgot password operation`, error);
    throw error;
  }
};

export const resetPassword = async (token: string, newPassword: string) => {
  try {
    console.log(
      "Resetting password with token:",
      token.substring(0, 15) + "..."
    );
    const options: RequestInit = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword }),
    };
    const response = await fetchWrapper(`/auth/reset-password`, options);
    return response;
  } catch (error) {
    console.error("Error with reset password operation", error);
    throw error;
  }
};

// Initialize auth state from session storage on module load
(function initAuthState() {
  const user = getCurrentUser();
  if (user?.token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${user.token}`;
    console.log("Set initial Authorization header from session storage");
  }
})();

export { api };

```

# services\groupService.ts

```ts
import { getCurrentUser } from "./authService";
import { fetchWrapper } from "./api";

// Set up auth headers
export const getAuthHeader = () => {
  const user = getCurrentUser();
  console.log(
    "Auth token:",
    user?.token ? `${user.token.substring(0, 15)}...` : "none"
  );

  // Create options object for fetch
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (user?.token) {
    headers["Authorization"] = `Bearer ${user.token}`;
  }

  return { headers };
};

/**
 * Fetch groups for a specific user
 */
export const fetchUserGroups = async (userId: number) => {
  try {
    console.log(`Fetching groups for user ${userId}`);
    const options = getAuthHeader();
    console.log("Request headers:", options);

    const data = await fetchWrapper(`/users/${userId}/groups`, options);
    return data.groups;
  } catch (error) {
    console.error(`Error fetching groups for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Fetch groups for the current user
 */
export const fetchMyGroups = async () => {
  try {
    const data = await fetchWrapper("/groups", getAuthHeader());
    return data;
  } catch (error) {
    console.error("Error fetching my groups:", error);
    throw error;
  }
};

/**
 * Fetch public groups
 */
export const fetchPublicGroups = async () => {
  try {
    const data = await fetchWrapper("/groups/public", getAuthHeader());
    return data.groups;
  } catch (error) {
    console.error("Error fetching public groups:", error);
    throw error;
  }
};

/**
 * Fetch details for a specific group
 */
export const fetchGroupDetails = async (groupId: string) => {
  try {
    const data = await fetchWrapper(`/groups/${groupId}`, getAuthHeader());
    return data;
  } catch (error) {
    console.error(`Error fetching details for group ${groupId}:`, error);
    throw error;
  }
};

/**
 * Create a new group
 */
export const createGroup = async (groupData: any) => {
  try {
    const options = {
      ...getAuthHeader(),
      method: "POST",
      body: JSON.stringify(groupData),
    };

    return await fetchWrapper("/groups", options);
  } catch (error) {
    console.error("Error creating group:", error);
    throw error;
  }
};

/**
 * Join a private group using an invite code
 */
export const joinGroup = async (
  codeOrId: string,
  isPublic: boolean = false
) => {
  try {
    // Different endpoints for joining public vs private groups
    const endpoint = isPublic ? `/groups/${codeOrId}/join` : "/groups/join";

    const payload = isPublic
      ? {} // No payload needed for public group join
      : { code: codeOrId };

    const options = {
      ...getAuthHeader(),
      method: "POST",
      body: JSON.stringify(payload),
    };

    return await fetchWrapper(endpoint, options);
  } catch (error) {
    console.error("Error joining group:", error);
    throw error;
  }
};

/**
 * Fetch members of a specific group
 */
export const fetchGroupMembers = async (groupId: string) => {
  if (!groupId) {
    return [];
  }

  try {
    const data = await fetchWrapper(
      `/groups/${groupId}/members`,
      getAuthHeader()
    );
    return data.members;
  } catch (error) {
    console.error(`Error fetching members for group ${groupId}:`, error);
    throw error;
  }
};

/**
 * Send an invitation to join a group
 */
export const sendGroupInvite = async (groupId: string, email: string) => {
  try {
    const options = {
      ...getAuthHeader(),
      method: "POST",
      body: JSON.stringify({ email }),
    };

    return await fetchWrapper(`/groups/${groupId}/invite`, options);
  } catch (error) {
    console.error(`Error sending invitation for group ${groupId}:`, error);
    throw error;
  }
};

/**
 * Leave a group
 */
export const leaveGroup = async (groupId: string) => {
  try {
    const options = {
      ...getAuthHeader(),
      method: "DELETE",
    };

    return await fetchWrapper(`/groups/${groupId}/members`, options);
  } catch (error) {
    console.error(`Error leaving group ${groupId}:`, error);
    throw error;
  }
};

/**
 * Delete a group (admin only)
 */
export const deleteGroup = async (groupId: string) => {
  try {
    const options = {
      ...getAuthHeader(),
      method: "DELETE",
    };

    return await fetchWrapper(`/groups/${groupId}`, options);
  } catch (error) {
    console.error(`Error deleting group ${groupId}:`, error);
    throw error;
  }
};

```

# styling\Styles.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

::-webkit-scrollbar-track {
  -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
  border-radius: 10px;
  background-color: #f5f5f5;
}

::-webkit-scrollbar {
  width: 12px;
  background-color: #f5f5f5;
}

::-webkit-scrollbar-thumb {
  border-radius: 10px;
  -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
  background-color: #b1a7a6;
}
/* Default Styles */
body {
  background-color: #f5f3f4;
  color: #0b090a;
  font-family: "Plus Jakarta Sans", sans-serif;
  line-height: 1.6;
  margin: 0;
  padding: 0;
}

/* Headings */
h1,
h2,
h3,
h4,
h5,
h6 {
  color: #0b090a;
  font-weight: bold;
}

h1 {
  font-size: 2.5rem;
}

h2 {
  font-size: 2rem;
}

h3 {
  font-size: 1.75rem;
}

h4 {
  font-size: 1.5rem;
}

h5 {
  font-size: 1.25rem;
}

h6 {
  font-size: 1rem;
}

/* Paragraphs */
p {
  color: #161a1d; /* Timberwolf */
  font-size: 1rem;
  margin-bottom: 1rem;
}

/* Links */
a {
  color: #ba181b; /* Cornell Red 2 */
  text-decoration: none;
}

a:hover {
  text-decoration: none;
}

/* Buttons */
button {
  background-color: #d3d3d3;
  color: #f5f3f4; /* White Smoke */
  padding: 10px 20px;
  font-size: 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.3s ease;
}

button:hover {
  background-color: #b1a7a6; /* Blood Red */
}

svg.star-svg {
  display: inline;
}

/* Secondary Button */
button.secondary {
  background-color: #161a1d; /* Eerie Black */
  color: #f5f3f4; /* White Smoke */
}

button.secondary:hover {
  background-color: #660708; /* Blood Red */
}

/* Card / Box Styling */
.card {
  background-color: #161a1d; /* Eerie Black */
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
  border: 1px solid #b1a7a6; /* Silver */
}

/* Forms */
input,
textarea {
  background-color: #0b090a; /* Night */
  border: 1px solid #b1a7a6; /* Silver */
  padding: 8px;
  border-radius: 4px;
}

input:focus,
textarea:focus {
  outline: none;
  border-color: #e5383b; /* Imperial Red */
}

/* Utility Classes */
.text-muted {
  color: #b1a7a6; /* Silver */
}

.text-danger {
  color: #e5383b; /* Imperial Red */
}

.text-center {
  text-align: center;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

```

# styling\theme.css

```css
*,
::after,
::before {
  box-sizing: border-box;
  border-width: 0;
  border-style: solid;
  border-color: #e7ecf0;
}
::after,
::before {
  --tw-content: "";
}
:host,
html {
  line-height: 1.5;
  -webkit-text-size-adjust: 100%;
  -moz-tab-size: 4;
  -o-tab-size: 4;
  tab-size: 4;
  font-family: Plus Jakarta Sans, sans-serif;
  font-feature-settings: normal;
  font-variation-settings: normal;
  -webkit-tap-highlight-color: transparent;
}
body {
  margin: 0;
  line-height: inherit;
}
hr {
  height: 0;
  color: inherit;
  border-top-width: 1px;
}
abbr:where([title]) {
  -webkit-text-decoration: underline dotted;
  text-decoration: underline dotted;
}
h1,
h2,
h3,
h4,
h5,
h6 {
  font-size: inherit;
  font-weight: inherit;
}
a {
  color: inherit;
  text-decoration: inherit;
}
b,
strong {
  font-weight: bolder;
}
code,
kbd,
pre,
samp {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    "Liberation Mono", "Courier New", monospace;
  font-feature-settings: normal;
  font-variation-settings: normal;
  font-size: 1em;
}
small {
  font-size: 80%;
}
sub,
sup {
  font-size: 75%;
  line-height: 0;
  position: relative;
  vertical-align: baseline;
}
sub {
  bottom: -0.25em;
}
sup {
  top: -0.5em;
}
table {
  text-indent: 0;
  border-color: inherit;
  border-collapse: collapse;
}
button,
input,
optgroup,
select,
textarea {
  font-family: inherit;
  font-feature-settings: inherit;
  font-variation-settings: inherit;
  font-size: 100%;
  font-weight: inherit;
  line-height: inherit;
  color: inherit;
  margin: 0;
  padding: 0;
}
button,
select {
  text-transform: none;
}
[type="reset"],
[type="submit"],
button {
  -webkit-appearance: button;
  background-image: none;
}
:-moz-focusring {
  outline: auto;
}
:-moz-ui-invalid {
  box-shadow: none;
}
progress {
  vertical-align: baseline;
}
::-webkit-inner-spin-button,
::-webkit-outer-spin-button {
  height: auto;
}
[type="search"] {
  -webkit-appearance: textfield;
  outline-offset: -2px;
}
::-webkit-search-decoration {
  -webkit-appearance: none;
}
::-webkit-file-upload-button {
  -webkit-appearance: button;
  font: inherit;
}
summary {
  display: list-item;
}
blockquote,
dd,
dl,
figure,
h1,
h2,
h3,
h4,
h5,
h6,
hr,
p,
pre {
  margin: 0;
}
fieldset {
  margin: 0;
  padding: 0;
}
legend {
  padding: 0;
}
menu,
ol,
ul {
  list-style: none;
  margin: 0;
  padding: 0;
}
dialog {
  padding: 0;
}
textarea {
  resize: vertical;
}
input::-moz-placeholder,
textarea::-moz-placeholder {
  opacity: 1;
  color: #707a82;
}
input::placeholder,
textarea::placeholder {
  opacity: 1;
  color: #707a82;
}
[role="button"],
button {
  cursor: pointer;
}
:disabled {
  cursor: default;
}
audio,
canvas,
embed,
iframe,
img,
object,
svg,
video {
  display: block;
  vertical-align: middle;
}
img,
video {
  max-width: 100%;
  height: auto;
}
[hidden] {
  display: none;
}
[multiple],
[type="date"],
[type="datetime-local"],
[type="email"],
[type="month"],
[type="number"],
[type="password"],
[type="search"],
[type="tel"],
[type="text"],
[type="time"],
[type="url"],
[type="week"],
input:where(:not([type])),
select,
textarea {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background-color: #fff;
  border-color: #111c2d;
  border-width: 1px;
  border-radius: 0;
  padding-top: 0.5rem;
  padding-right: 0.75rem;
  padding-bottom: 0.5rem;
  padding-left: 0.75rem;
  font-size: 1rem;
  line-height: 1.5rem;
  --tw-shadow: 0 0 #0000;
}
[multiple]:focus,
[type="date"]:focus,
[type="datetime-local"]:focus,
[type="email"]:focus,
[type="month"]:focus,
[type="number"]:focus,
[type="password"]:focus,
[type="search"]:focus,
[type="tel"]:focus,
[type="text"]:focus,
[type="time"]:focus,
[type="url"]:focus,
[type="week"]:focus,
input:where(:not([type])):focus,
select:focus,
textarea:focus {
  outline: 2px solid transparent;
  outline-offset: 2px;
  --tw-ring-inset: var(--tw-empty); /*!*/ /*!*/
  --tw-ring-offset-width: 0px;
  --tw-ring-offset-color: #fff;
  --tw-ring-color: #0085db;
  --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0
    var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  --tw-ring-shadow: var(--tw-ring-inset) 0 0 0
    calc(1px + var(--tw-ring-offset-width)) var(--tw-ring-color);
  box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow),
    var(--tw-shadow);
  border-color: #0085db;
}
input::-moz-placeholder,
textarea::-moz-placeholder {
  color: #111c2d;
  opacity: 1;
}
input::placeholder,
textarea::placeholder {
  color: #111c2d;
  opacity: 1;
}
::-webkit-datetime-edit-fields-wrapper {
  padding: 0;
}
::-webkit-date-and-time-value {
  min-height: 1.5em;
  text-align: inherit;
}
::-webkit-datetime-edit {
  display: inline-flex;
}
::-webkit-datetime-edit,
::-webkit-datetime-edit-day-field,
::-webkit-datetime-edit-hour-field,
::-webkit-datetime-edit-meridiem-field,
::-webkit-datetime-edit-millisecond-field,
::-webkit-datetime-edit-minute-field,
::-webkit-datetime-edit-month-field,
::-webkit-datetime-edit-second-field,
::-webkit-datetime-edit-year-field {
  padding-top: 0;
  padding-bottom: 0;
}
select {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23111c2d' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.5rem center;
  background-repeat: no-repeat;
  background-size: 1.5em 1.5em;
  padding-right: 2.5rem;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
[multiple],
[size]:where(select:not([size="1"])) {
  background-image: initial;
  background-position: initial;
  background-repeat: unset;
  background-size: initial;
  padding-right: 0.75rem;
  -webkit-print-color-adjust: unset;
  print-color-adjust: unset;
}
[type="checkbox"],
[type="radio"] {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  padding: 0;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
  display: inline-block;
  vertical-align: middle;
  background-origin: border-box;
  -webkit-user-select: none;
  -moz-user-select: none;
  user-select: none;
  flex-shrink: 0;
  height: 1rem;
  width: 1rem;
  color: #0085db;
  background-color: #fff;
  border-color: #111c2d;
  border-width: 1px;
  --tw-shadow: 0 0 #0000;
}
[type="checkbox"] {
  border-radius: 0;
}
[type="radio"] {
  border-radius: 100%;
}
[type="checkbox"]:focus,
[type="radio"]:focus {
  outline: 2px solid transparent;
  outline-offset: 2px;
  --tw-ring-inset: var(--tw-empty); /*!*/ /*!*/
  --tw-ring-offset-width: 2px;
  --tw-ring-offset-color: #fff;
  --tw-ring-color: #0085db;
  --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0
    var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  --tw-ring-shadow: var(--tw-ring-inset) 0 0 0
    calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color);
  box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow),
    var(--tw-shadow);
}
[type="checkbox"]:checked,
[type="radio"]:checked {
  border-color: transparent;
  background-color: currentColor;
  background-size: 100% 100%;
  background-position: center;
  background-repeat: no-repeat;
}
[type="checkbox"]:checked {
  background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3e%3c/svg%3e");
}
@media (forced-colors: active) {
  [type="checkbox"]:checked {
    -webkit-appearance: auto;
    -moz-appearance: auto;
    appearance: auto;
  }
}
[type="radio"]:checked {
  background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3ccircle cx='8' cy='8' r='3'/%3e%3c/svg%3e");
}
@media (forced-colors: active) {
  [type="radio"]:checked {
    -webkit-appearance: auto;
    -moz-appearance: auto;
    appearance: auto;
  }
}
[type="checkbox"]:checked:focus,
[type="checkbox"]:checked:hover,
[type="radio"]:checked:focus,
[type="radio"]:checked:hover {
  border-color: transparent;
  background-color: currentColor;
}
[type="checkbox"]:indeterminate {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 16 16'%3e%3cpath stroke='white' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M4 8h8'/%3e%3c/svg%3e");
  border-color: transparent;
  background-color: currentColor;
  background-size: 100% 100%;
  background-position: center;
  background-repeat: no-repeat;
}
@media (forced-colors: active) {
  [type="checkbox"]:indeterminate {
    -webkit-appearance: auto;
    -moz-appearance: auto;
    appearance: auto;
  }
}
[type="checkbox"]:indeterminate:focus,
[type="checkbox"]:indeterminate:hover {
  border-color: transparent;
  background-color: currentColor;
}
[type="file"] {
  background: unset;
  border-color: inherit;
  border-width: 0;
  border-radius: 0;
  padding: 0;
  font-size: unset;
  line-height: inherit;
}
[type="file"]:focus {
  outline: 1px solid ButtonText;
  outline: 1px auto -webkit-focus-ring-color;
}
*,
::after,
::before {
  --tw-border-spacing-x: 0;
  --tw-border-spacing-y: 0;
  --tw-translate-x: 0;
  --tw-translate-y: 0;
  --tw-rotate: 0;
  --tw-skew-x: 0;
  --tw-skew-y: 0;
  --tw-scale-x: 1;
  --tw-scale-y: 1;
  --tw-scroll-snap-strictness: proximity;
  --tw-ring-offset-width: 0px;
  --tw-ring-offset-color: #fff;
  --tw-ring-color: rgb(229 243 251 / 0.5);
  --tw-ring-offset-shadow: 0 0 #0000;
  --tw-ring-shadow: 0 0 #0000;
  --tw-shadow: 0 0 #0000;
  --tw-shadow-colored: 0 0 #0000;
}
::backdrop {
  --tw-border-spacing-x: 0;
  --tw-border-spacing-y: 0;
  --tw-translate-x: 0;
  --tw-translate-y: 0;
  --tw-rotate: 0;
  --tw-skew-x: 0;
  --tw-skew-y: 0;
  --tw-scale-x: 1;
  --tw-scale-y: 1;
  --tw-scroll-snap-strictness: proximity;
  --tw-ring-offset-width: 0px;
  --tw-ring-offset-color: #fff;
  --tw-ring-color: rgb(229 243 251 / 0.5);
  --tw-ring-offset-shadow: 0 0 #0000;
  --tw-ring-shadow: 0 0 #0000;
  --tw-shadow: 0 0 #0000;
  --tw-shadow-colored: 0 0 #0000;
}
.container {
  width: 100%;
  margin-right: auto;
  margin-left: auto;
  padding-right: 20px;
  padding-left: 20px;
}
@media (min-width: 640px) {
  .container {
    max-width: 640px;
  }
}
@media (min-width: 768px) {
  .container {
    max-width: 768px;
  }
}
@media (min-width: 1024px) {
  .container {
    max-width: 1024px;
  }
}
@media (min-width: 1280px) {
  .container {
    max-width: 1280px;
  }
}
@media (min-width: 1536px) {
  .container {
    max-width: 1536px;
  }
}
.container {
  max-width: 80rem;
}
.card {
  position: relative;
  border-radius: 18px;
  --tw-bg-opacity: 1;
  background-color: rgb(255 255 255 / var(--tw-bg-opacity));
  --tw-shadow: 0px 2px 6px rgba(37, 83, 185, 0.1);
  --tw-shadow-colored: 0px 2px 6px var(--tw-shadow-color);
  box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000),
    var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
}
.card-body {
  padding: 1.5rem;
}
.hs-dropdown-menu {
  position: relative;
  border-radius: 18px;
  --tw-bg-opacity: 1;
  background-color: rgb(255 255 255 / var(--tw-bg-opacity));
  --tw-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
  --tw-shadow-colored: 0 0.5rem 1rem var(--tw-shadow-color);
  box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000),
    var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
}
.btn {
  border-radius: 30px;
  --tw-bg-opacity: 1;
  background-color: rgb(220 38 38 / var(--tw-bg-opacity));
  padding-top: 0.75rem;
  padding-bottom: 0.75rem;
  padding-left: 1.75rem;
  padding-right: 1.75rem;
  text-align: center;
  font-size: 0.875rem;
  line-height: 1.25rem;
  --tw-text-opacity: 1;
  color: rgb(255 255 255 / var(--tw-text-opacity));
}
.btn-outline-primary {
  border-radius: 30px;
  border-width: 1px;
  --tw-border-opacity: 1;
  border-color: rgb(220 38 38 / var(--tw-border-opacity));
  padding-top: 0.625rem;
  padding-bottom: 0.625rem;
  padding-left: 1.75rem;
  padding-right: 1.75rem;
  text-align: center;
  font-size: 0.875rem;
  line-height: 1.25rem;
  --tw-text-opacity: 1;
  color: rgb(220 38 38 / var(--tw-text-opacity));
}
.fixed {
  position: fixed;
}
.absolute {
  position: absolute;
}
.relative {
  position: relative;
}
.-right-\[6px\] {
  right: -6px;
}
.-top-\[1px\] {
  top: -1px;
}
.bottom-0 {
  bottom: 0;
}
.left-0 {
  left: 0;
}
.right-0 {
  right: 0;
}
.top-0 {
  top: 0;
}
.z-\[12\] {
  z-index: 12;
}
.z-\[1\] {
  z-index: 1;
}
.z-\[999\] {
  z-index: 999;
}
.col-span-2 {
  grid-column: span 2 / span 2;
}
.m-4 {
  margin: 1rem;
}
.mx-auto {
  margin-left: auto;
  margin-right: auto;
}
.my-1 {
  margin-top: 0.25rem;
  margin-bottom: 0.25rem;
}
.my-6 {
  margin-top: 1.5rem;
  margin-bottom: 1.5rem;
}
.my-\[10px\] {
  margin-top: 10px;
  margin-bottom: 10px;
}
.-mb-3 {
  margin-bottom: -0.75rem;
}
.mb-1 {
  margin-bottom: 0.25rem;
}
.mb-2 {
  margin-bottom: 0.5rem;
}
.mb-3 {
  margin-bottom: 0.75rem;
}
.mb-4 {
  margin-bottom: 1rem;
}
.mb-5 {
  margin-bottom: 1.25rem;
}
.mb-6 {
  margin-bottom: 1.5rem;
}
.mr-4 {
  margin-right: 1rem;
}
.ms-3 {
  margin-inline-start: 0.75rem;
}
.mt-0 {
  margin-top: 0;
}
.mt-0\.5 {
  margin-top: 0.125rem;
}
.mt-1 {
  margin-top: 0.25rem;
}
.mt-2 {
  margin-top: 0.5rem;
}
.mt-3 {
  margin-top: 0.75rem;
}
.mt-4 {
  margin-top: 1rem;
}
.mt-5 {
  margin-top: 1.25rem;
}
.mt-6 {
  margin-top: 1.5rem;
}
.mt-8 {
  margin-top: 2rem;
}
.mt-\[7px\] {
  margin-top: 7px;
}
.block {
  display: block;
}
.inline-block {
  display: inline-block;
}
.flex {
  display: flex;
}
.inline-flex {
  display: inline-flex;
}
.table {
  display: table;
}
.grid {
  display: grid;
}
.hidden {
  display: none;
}
.h-11 {
  height: 2.75rem;
}
.h-12 {
  height: 3rem;
}
.h-2 {
  height: 0.5rem;
}
.h-3 {
  height: 0.75rem;
}
.h-5 {
  height: 1.25rem;
}
.h-8 {
  height: 2rem;
}
.h-9 {
  height: 2.25rem;
}
.h-auto {
  height: auto;
}
.h-full {
  height: 100%;
}
.h-screen {
  height: 100vh;
}
.min-h-\[70px\] {
  min-height: 70px;
}
.min-h-screen {
  min-height: 100vh;
}
.w-11 {
  width: 2.75rem;
}
.w-12 {
  width: 3rem;
}
.w-2 {
  width: 0.5rem;
}
.w-3 {
  width: 0.75rem;
}
.w-5 {
  width: 1.25rem;
}
.w-8 {
  width: 2rem;
}
.w-9 {
  width: 2.25rem;
}
.w-\[150px\] {
  width: 150px;
}
.w-\[1px\] {
  width: 1px;
}
.w-\[200px\] {
  width: 200px;
}
.w-\[270px\] {
  width: 270px;
}
.w-\[300px\] {
  width: 300px;
}
.w-fit {
  width: -moz-fit-content;
  width: fit-content;
}
.w-full {
  width: 100%;
}
.min-w-\[90px\] {
  min-width: 90px;
}
.min-w-max {
  min-width: -moz-max-content;
  min-width: max-content;
}
.max-w-full {
  max-width: 100%;
}
.max-w-md {
  max-width: 28rem;
}
.shrink-0 {
  flex-shrink: 0;
}
.-translate-x-full {
  --tw-translate-x: -100%;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y))
    rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y))
    scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.transform {
  transform: translate(var(--tw-translate-x), var(--tw-translate-y))
    rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y))
    scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.cursor-pointer {
  cursor: pointer;
}
.list-none {
  list-style-type: none;
}
.grid-cols-1 {
  grid-template-columns: repeat(1, minmax(0, 1fr));
}
.flex-col {
  flex-direction: column;
}
.flex-wrap {
  flex-wrap: wrap;
}
.items-center {
  align-items: center;
}
.justify-center {
  justify-content: center;
}
.justify-between {
  justify-content: space-between;
}
.gap-1 {
  gap: 0.25rem;
}
.gap-12 {
  gap: 3rem;
}
.gap-2 {
  gap: 0.5rem;
}
.gap-3 {
  gap: 0.75rem;
}
.gap-4 {
  gap: 1rem;
}
.gap-6 {
  gap: 1.5rem;
}
.gap-x-0 {
  -moz-column-gap: 0;
  column-gap: 0;
}
.gap-x-1 {
  -moz-column-gap: 0.25rem;
  column-gap: 0.25rem;
}
.gap-x-2 {
  -moz-column-gap: 0.5rem;
  column-gap: 0.5rem;
}
.gap-y-6 {
  row-gap: 1.5rem;
}
.self-start {
  align-self: flex-start;
}
.overflow-hidden {
  overflow: hidden;
}
.overflow-x-auto {
  overflow-x: auto;
}
.whitespace-nowrap {
  white-space: nowrap;
}
.text-nowrap {
  text-wrap: nowrap;
}
.rounded-2xl {
  border-radius: 30px;
}
.rounded-3xl {
  border-radius: 50rem;
}
.rounded-\[4px\] {
  border-radius: 4px;
}
.rounded-full {
  border-radius: 50%;
}
.rounded-md {
  border-radius: 18px;
}
.rounded-none {
  border-radius: 0;
}
.rounded-sm {
  border-radius: 7px;
}
.border {
  border-width: 1px;
}
.border-2 {
  border-width: 2px;
}
.border-red-300 {
  --tw-border-opacity: 1;
  border-color: rgb(70 202 235 / var(--tw-border-opacity));
}
.border-red-600 {
  --tw-border-opacity: 1;
  border-color: rgb(220 38 38 / var(--tw-border-opacity));
}
.border-gray-100 {
  --tw-border-opacity: 1;
  border-color: rgb(230 236 241 / var(--tw-border-opacity));
}
.border-gray-200 {
  --tw-border-opacity: 1;
  border-color: rgb(231 236 240 / var(--tw-border-opacity));
}
.border-gray-400 {
  --tw-border-opacity: 1;
  border-color: rgb(112 122 130 / var(--tw-border-opacity));
}
.border-gray-700 {
  --tw-border-opacity: 1;
  border-color: rgb(95 104 111 / var(--tw-border-opacity));
}
.border-red-500 {
  --tw-border-opacity: 1;
  border-color: rgb(251 151 125 / var(--tw-border-opacity));
}
.border-teal-500 {
  --tw-border-opacity: 1;
  border-color: rgb(75 208 139 / var(--tw-border-opacity));
}
.border-transparent {
  border-color: transparent;
}
.border-yellow-500 {
  --tw-border-opacity: 1;
  border-color: rgb(248 192 118 / var(--tw-border-opacity));
}
.bg-red-200 {
  --tw-bg-opacity: 1;
  background-color: rgb(225 245 250 / var(--tw-bg-opacity));
}
.bg-red-300 {
  --tw-bg-opacity: 1;
  background-color: rgb(70 202 235 / var(--tw-bg-opacity));
}
.bg-red-500 {
  --tw-bg-opacity: 1;
  background-color: rgb(229 243 251 / var(--tw-bg-opacity));
}
.bg-red-600 {
  --tw-bg-opacity: 1;
  background-color: rgb(220 38 38 / var(--tw-bg-opacity));
}
.bg-gray-100 {
  --tw-bg-opacity: 1;
  background-color: rgb(230 236 241 / var(--tw-bg-opacity));
}
.bg-gray-200 {
  --tw-bg-opacity: 1;
  background-color: rgb(231 236 240 / var(--tw-bg-opacity));
}
.bg-gray-400 {
  --tw-bg-opacity: 1;
  background-color: rgb(112 122 130 / var(--tw-bg-opacity));
}
.bg-gray-500 {
  --tw-bg-opacity: 1;
  background-color: rgb(17 28 45 / var(--tw-bg-opacity));
}
.bg-gray-800 {
  --tw-bg-opacity: 1;
  background-color: rgb(226 228 230 / var(--tw-bg-opacity));
}
.bg-red-400 {
  --tw-bg-opacity: 1;
  background-color: rgb(255 237 233 / var(--tw-bg-opacity));
}
.bg-red-500 {
  --tw-bg-opacity: 1;
  background-color: rgb(251 151 125 / var(--tw-bg-opacity));
}
.bg-surface {
  --tw-bg-opacity: 1;
  background-color: rgb(240 245 249 / var(--tw-bg-opacity));
}
.bg-teal-400 {
  --tw-bg-opacity: 1;
  background-color: rgb(223 255 243 / var(--tw-bg-opacity));
}
.bg-teal-500 {
  --tw-bg-opacity: 1;
  background-color: rgb(75 208 139 / var(--tw-bg-opacity));
}
.bg-transparent {
  background-color: transparent;
}
.bg-white {
  --tw-bg-opacity: 1;
  background-color: rgb(255 255 255 / var(--tw-bg-opacity));
}
.bg-yellow-400 {
  --tw-bg-opacity: 1;
  background-color: rgb(255 246 234 / var(--tw-bg-opacity));
}
.bg-yellow-500 {
  --tw-bg-opacity: 1;
  background-color: rgb(248 192 118 / var(--tw-bg-opacity));
}
.object-cover {
  -o-object-fit: cover;
  object-fit: cover;
}
.p-0 {
  padding: 0;
}
.p-3 {
  padding: 0.75rem;
}
.p-4 {
  padding: 1rem;
}
.p-5 {
  padding: 1.25rem;
}
.px-0 {
  padding-left: 0;
  padding-right: 0;
}
.px-4 {
  padding-left: 1rem;
  padding-right: 1rem;
}
.px-6 {
  padding-left: 1.5rem;
  padding-right: 1.5rem;
}
.px-7 {
  padding-left: 1.75rem;
  padding-right: 1.75rem;
}
.py-1 {
  padding-top: 0.25rem;
  padding-bottom: 0.25rem;
}
.py-1\.5 {
  padding-top: 0.375rem;
  padding-bottom: 0.375rem;
}
.py-2 {
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
}
.py-2\.5 {
  padding-top: 0.625rem;
  padding-bottom: 0.625rem;
}
.py-3 {
  padding-top: 0.75rem;
  padding-bottom: 0.75rem;
}
.py-4 {
  padding-top: 1rem;
  padding-bottom: 1rem;
}
.py-\[10px\] {
  padding-top: 10px;
  padding-bottom: 10px;
}
.py-\[6px\] {
  padding-top: 6px;
  padding-bottom: 6px;
}
.pb-\[5px\] {
  padding-bottom: 5px;
}
.pe-9 {
  padding-inline-end: 2.25rem;
}
.pr-4 {
  padding-right: 1rem;
}
.ps-2 {
  padding-inline-start: 0.5rem;
}
.text-left {
  text-align: left;
}
.text-center {
  text-align: center;
}
.text-end {
  text-align: end;
}
.align-middle {
  vertical-align: middle;
}
.text-2xl {
  font-size: 1.5rem;
  line-height: 2rem;
}
.text-3xl {
  font-size: 1.875rem;
  line-height: 2.25rem;
}
.text-4xl {
  font-size: 2.25rem;
  line-height: 2.5rem;
}
.text-\[11px\] {
  font-size: 11px;
}
.text-\[15px\] {
  font-size: 15px;
}
.text-\[22px\] {
  font-size: 22px;
}
.text-base {
  font-size: 1rem;
  line-height: 1.5rem;
}
.text-lg {
  font-size: 1.125rem;
  line-height: 1.75rem;
}
.text-sm {
  font-size: 0.875rem;
  line-height: 1.25rem;
}
.text-xl {
  font-size: 1.25rem;
  line-height: 1.75rem;
}
.text-xs {
  font-size: 0.75rem;
  line-height: 1rem;
}
.font-bold {
  font-weight: 700;
}
.font-medium {
  font-weight: 500;
}
.font-normal {
  font-weight: 400;
}
.font-semibold {
  font-weight: 600;
}
.text-blue-300 {
  --tw-text-opacity: 1;
  color: rgb(70 202 235 / var(--tw-text-opacity));
}
.text-blue-600 {
  --tw-text-opacity: 1;
  color: rgb(220 38 38 / var(--tw-text-opacity));
}
.text-gray-200 {
  --tw-text-opacity: 1;
  color: rgb(231 236 240 / var(--tw-text-opacity));
}
.text-gray-300 {
  color: #0000008c;
}
.text-gray-400 {
  --tw-text-opacity: 1;
  color: rgb(112 122 130 / var(--tw-text-opacity));
}
.text-gray-500 {
  --tw-text-opacity: 1;
  color: rgb(17 28 45 / var(--tw-text-opacity));
}
.text-gray-600 {
  --tw-text-opacity: 1;
  color: rgb(196 201 204 / var(--tw-text-opacity));
}
.text-red-500 {
  --tw-text-opacity: 1;
  color: rgb(251 151 125 / var(--tw-text-opacity));
}
.text-teal-500 {
  --tw-text-opacity: 1;
  color: rgb(75 208 139 / var(--tw-text-opacity));
}
.text-white {
  --tw-text-opacity: 1;
  color: rgb(255 255 255 / var(--tw-text-opacity));
}
.text-yellow-500 {
  --tw-text-opacity: 1;
  color: rgb(248 192 118 / var(--tw-text-opacity));
}
.underline {
  text-decoration-line: underline;
}
.opacity-0 {
  opacity: 0;
}
.opacity-60 {
  opacity: 0.6;
}
.opacity-75 {
  opacity: 0.75;
}
.opacity-80 {
  opacity: 0.8;
}
.shadow-md {
  --tw-shadow: 0px 2px 6px rgba(37, 83, 185, 0.1);
  --tw-shadow-colored: 0px 2px 6px var(--tw-shadow-color);
  box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000),
    var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
}
.transition-\[opacity\2c margin\] {
  transition-property: opacity, margin;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}
.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}
.duration-300 {
  transition-duration: 0.3s;
}
.\[--placement\:bottom-left\] {
  --placement: bottom-left;
}
.\[--placement\:bottom-right\] {
  --placement: bottom-right;
}
.placeholder\:opacity-40::-moz-placeholder {
  opacity: 0.4;
}
.placeholder\:opacity-40::placeholder {
  opacity: 0.4;
}
.hover\:border-blue-300:hover {
  --tw-border-opacity: 1;
  border-color: rgb(70 202 235 / var(--tw-border-opacity));
}
.hover\:border-blue-600:hover {
  --tw-border-opacity: 1;
  border-color: rgb(220 38 38 / var(--tw-border-opacity));
}
.hover\:border-gray-400:hover {
  --tw-border-opacity: 1;
  border-color: rgb(112 122 130 / var(--tw-border-opacity));
}
.hover\:border-gray-700:hover {
  --tw-border-opacity: 1;
  border-color: rgb(95 104 111 / var(--tw-border-opacity));
}
.hover\:border-red-500:hover {
  --tw-border-opacity: 1;
  border-color: rgb(251 151 125 / var(--tw-border-opacity));
}
.hover\:border-teal-500:hover {
  --tw-border-opacity: 1;
  border-color: rgb(75 208 139 / var(--tw-border-opacity));
}
.hover\:border-transparent:hover {
  border-color: transparent;
}
.hover\:border-yellow-500:hover {
  --tw-border-opacity: 1;
  border-color: rgb(248 192 118 / var(--tw-border-opacity));
}
.hover\:bg-blue-300:hover {
  --tw-bg-opacity: 1;
  background-color: rgb(70 202 235 / var(--tw-bg-opacity));
}
.hover\:bg-blue-400:hover {
  --tw-bg-opacity: 1;
  background-color: rgb(60 172 200 / var(--tw-bg-opacity));
}
.hover\:bg-blue-600:hover {
  --tw-bg-opacity: 1;
  background-color: rgb(220 38 38 / var(--tw-bg-opacity));
}
.hover\:bg-blue-700:hover {
  --tw-bg-opacity: 1;
  background-color: rgb(0 113 186 / var(--tw-bg-opacity));
}
.hover\:bg-gray-200:hover {
  --tw-bg-opacity: 1;
  background-color: rgb(231 236 240 / var(--tw-bg-opacity));
}
.hover\:bg-gray-400:hover {
  --tw-bg-opacity: 1;
  background-color: rgb(112 122 130 / var(--tw-bg-opacity));
}
.hover\:bg-gray-500:hover {
  --tw-bg-opacity: 1;
  background-color: rgb(17 28 45 / var(--tw-bg-opacity));
}
.hover\:bg-gray-600:hover {
  --tw-bg-opacity: 1;
  background-color: rgb(196 201 204 / var(--tw-bg-opacity));
}
.hover\:bg-gray-700:hover {
  --tw-bg-opacity: 1;
  background-color: rgb(95 104 111 / var(--tw-bg-opacity));
}
.hover\:bg-red-500:hover {
  --tw-bg-opacity: 1;
  background-color: rgb(251 151 125 / var(--tw-bg-opacity));
}
.hover\:bg-red-600:hover {
  --tw-bg-opacity: 1;
  background-color: rgb(213 128 106 / var(--tw-bg-opacity));
}
.hover\:bg-teal-500:hover {
  --tw-bg-opacity: 1;
  background-color: rgb(75 208 139 / var(--tw-bg-opacity));
}
.hover\:bg-teal-600:hover {
  --tw-bg-opacity: 1;
  background-color: rgb(64 177 118 / var(--tw-bg-opacity));
}
.hover\:bg-yellow-500:hover {
  --tw-bg-opacity: 1;
  background-color: rgb(248 192 118 / var(--tw-bg-opacity));
}
.hover\:bg-yellow-600:hover {
  --tw-bg-opacity: 1;
  background-color: rgb(215 165 100 / var(--tw-bg-opacity));
}
.hover\:text-blue-600:hover {
  --tw-text-opacity: 1;
  color: rgb(220 38 38 / var(--tw-text-opacity));
}
.hover\:text-blue-700:hover {
  --tw-text-opacity: 1;
  color: rgb(0 113 186 / var(--tw-text-opacity));
}
.hover\:text-gray-500:hover {
  --tw-text-opacity: 1;
  color: rgb(17 28 45 / var(--tw-text-opacity));
}
.hover\:text-white:hover {
  --tw-text-opacity: 1;
  color: rgb(255 255 255 / var(--tw-text-opacity));
}
.focus\:border-blue-500:focus {
  --tw-border-opacity: 1;
  border-color: rgb(229 243 251 / var(--tw-border-opacity));
}
.focus\:border-blue-600:focus {
  --tw-border-opacity: 1;
  border-color: rgb(220 38 38 / var(--tw-border-opacity));
}
.focus\:ring-0:focus {
  --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0
    var(--tw-ring-offset-width) var(--tw-ring-offset-color);
  --tw-ring-shadow: var(--tw-ring-inset) 0 0 0
    calc(0px + var(--tw-ring-offset-width)) var(--tw-ring-color);
  box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow),
    var(--tw-shadow, 0 0 #0000);
}
.focus\:ring-blue-500:focus {
  --tw-ring-opacity: 1;
  --tw-ring-color: rgb(229 243 251 / var(--tw-ring-opacity));
}
.disabled\:pointer-events-none:disabled {
  pointer-events: none;
}
.disabled\:bg-gray-200:disabled {
  --tw-bg-opacity: 1;
  background-color: rgb(231 236 240 / var(--tw-bg-opacity));
}
.disabled\:opacity-50:disabled {
  opacity: 0.5;
}
.disabled\:opacity-60:disabled {
  opacity: 0.6;
}
.disabled\:shadow-xl:disabled {
  --tw-shadow: inset 0 1px 2px rgba(90, 106, 133, 0.075);
  --tw-shadow-colored: inset 0 1px 2px var(--tw-shadow-color);
  box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000),
    var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
}
.hs-dropdown.open > .hs-dropdown-open\:opacity-100 {
  opacity: 1;
}
.hs-dropdown.open > .hs-dropdown-menu > .hs-dropdown-open\:opacity-100 {
  opacity: 1;
}
.open.hs-overlay-open\:translate-x-0 {
  --tw-translate-x: 0px;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y))
    rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y))
    scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
.open .hs-overlay-open\:translate-x-0 {
  --tw-translate-x: 0px;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y))
    rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y))
    scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}
@media (min-width: 640px) {
  .sm\:mb-0 {
    margin-bottom: 0;
  }
  .sm\:\[--trigger\:hover\] {
    --trigger: hover;
  }
}
@media (min-width: 1024px) {
  .lg\:flex {
    display: flex;
  }
  .lg\:grid-cols-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .lg\:grid-cols-3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .lg\:gap-x-6 {
    -moz-column-gap: 1.5rem;
    column-gap: 1.5rem;
  }
  .lg\:gap-y-0 {
    row-gap: 0;
  }
}
@media (min-width: 1280px) {
  .xl\:bottom-0 {
    bottom: 0;
  }
  .xl\:end-auto {
    inset-inline-end: auto;
  }
  .xl\:left-auto {
    left: auto;
  }
  .xl\:top-5 {
    top: 1.25rem;
  }
  .xl\:block {
    display: block;
  }
  .xl\:hidden {
    display: none;
  }
  .xl\:translate-x-0 {
    --tw-translate-x: 0px;
    transform: translate(var(--tw-translate-x), var(--tw-translate-y))
      rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y))
      scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
  }
  .xl\:grid-cols-4 {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
  .xl\:rounded-md {
    border-radius: 18px;
  }
  .xl\:px-6 {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }
  .xl\:pr-0 {
    padding-right: 0;
  }
}
[data-simplebar] {
  position: relative;
  flex-direction: column;
  flex-wrap: wrap;
  justify-content: flex-start;
  align-content: flex-start;
  align-items: flex-start;
}
.simplebar-wrapper {
  overflow: hidden;
  width: inherit;
  height: inherit;
  max-width: inherit;
  max-height: inherit;
}
.simplebar-mask {
  direction: inherit;
  position: absolute;
  overflow: hidden;
  padding: 0;
  margin: 0;
  left: 0;
  top: 0;
  bottom: 0;
  right: 0;
  width: auto !important;
  height: auto !important;
  z-index: 0;
}
.simplebar-offset {
  direction: inherit !important;
  box-sizing: inherit !important;
  resize: none !important;
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  padding: 0;
  margin: 0;
  -webkit-overflow-scrolling: touch;
}
.simplebar-content-wrapper {
  direction: inherit;
  box-sizing: border-box !important;
  position: relative;
  display: block;
  height: 100%;
  width: auto;
  max-width: 100%;
  max-height: 100%;
  overflow: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.simplebar-content-wrapper::-webkit-scrollbar,
.simplebar-hide-scrollbar::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}
.simplebar-content:after,
.simplebar-content:before {
  content: " ";
  display: table;
}
.simplebar-placeholder {
  max-height: 100%;
  max-width: 100%;
  width: 100%;
  pointer-events: none;
}
.simplebar-height-auto-observer-wrapper {
  box-sizing: inherit !important;
  height: 100%;
  width: 100%;
  max-width: 1px;
  position: relative;
  float: left;
  max-height: 1px;
  overflow: hidden;
  z-index: -1;
  padding: 0;
  margin: 0;
  pointer-events: none;
  flex-grow: inherit;
  flex-shrink: 0;
  flex-basis: 0;
}
.simplebar-height-auto-observer {
  box-sizing: inherit;
  display: block;
  opacity: 0;
  position: absolute;
  top: 0;
  left: 0;
  height: 1000%;
  width: 1000%;
  min-height: 1px;
  min-width: 1px;
  overflow: hidden;
  pointer-events: none;
  z-index: -1;
}
.simplebar-track {
  z-index: 1;
  position: absolute;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
}
[data-simplebar].simplebar-dragging {
  pointer-events: none;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  user-select: none;
}
[data-simplebar].simplebar-dragging .simplebar-content {
  pointer-events: none;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  user-select: none;
}
[data-simplebar].simplebar-dragging .simplebar-track {
  pointer-events: all;
}
.simplebar-scrollbar {
  position: absolute;
  left: 0;
  right: 0;
  min-height: 10px;
}
.simplebar-scrollbar:before {
  position: absolute;
  content: "";
  background: #000;
  border-radius: 7px;
  left: 2px;
  right: 2px;
  opacity: 0;
  transition: opacity 0.2s 0.5s linear;
}
.simplebar-scrollbar.simplebar-visible:before {
  opacity: 0.5;
  transition-delay: 0s;
  transition-duration: 0s;
}
.simplebar-track.simplebar-vertical {
  top: 0;
  width: 11px;
}
.simplebar-scrollbar:before {
  top: 2px;
  bottom: 2px;
  left: 2px;
  right: 2px;
}
.simplebar-track.simplebar-horizontal {
  left: 0;
  height: 11px;
}
.simplebar-track.simplebar-horizontal .simplebar-scrollbar {
  right: auto;
  left: 0;
  top: 0;
  bottom: 0;
  min-height: 0;
  min-width: 10px;
  width: auto;
}
.simplebar-dummy-scrollbar-size {
  direction: rtl;
  position: fixed;
  opacity: 0;
  visibility: hidden;
  height: 500px;
  width: 500px;
  overflow-y: hidden;
  overflow-x: scroll;
  -ms-overflow-style: scrollbar !important;
}
.simplebar-dummy-scrollbar-size > div {
  width: 200%;
  height: 200%;
  margin: 10px 0;
}
.simplebar-hide-scrollbar {
  position: fixed;
  left: 0;
  visibility: hidden;
  overflow-y: scroll;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.hs-overlay-backdrop {
  left: 0;
  top: 0;
  background: rgba(0, 0, 0, 0.5);
  position: fixed;
  height: 100%;
  width: 100%;
}
.sidebar-scroll {
  height: calc(100% - 50px);
}
.radial-gradient:before {
  content: "";
  position: absolute;
  height: 100%;
  width: 100%;
  opacity: 0.3;
  background: radial-gradient(#d2f1df, #d3d7fa, #bad8f4) 0 0/400% 400%;
}
iframe {
  height: calc(100vh - 250px);
}
.simplebar-scrollbar:before {
  background: rgba(0, 0, 0, 0.5) !important;
}
.left-sidebar .scroll-sidebar {
  height: calc(100vh - 180px);
}
#sidebarnav .sidebar-item .sidebar-link::before {
  position: absolute;
  top: 0;
  bottom: 0;
  left: -16px;
  content: "";
  width: 0;
  height: 100%;
  z-index: -1;
  border-radius: 0 24px 24px 0;
  transition: all 0.4s ease-in-out;
  background-color: #e5f3fb;
}
#sidebarnav .sidebar-item .sidebar-link:hover:before {
  width: calc(100% + 16px);
}
#sidebarnav .sidebar-item .sidebar-link.active:before {
  width: calc(100% + 16px);
}
#sidebarnav .sidebar-item .sidebar-link.active {
  color: #006aaf;
}
#sidebarnav .sidebar-item .sidebar-link:hover {
  color: #006aaf;
}
.page-wrapper {
  margin-left: 270px;
}
@media (max-width: 1280px) {
  .page-wrapper {
    margin-left: 0;
  }
}

```

# types\auth-types.ts

```ts
export interface AuthFormData {
  email: string;
  username?: string;
  password: string;
}

export interface User {
  id: number;
  email: string;
  username: string;
  image?: string | null;
  avatarColor?: string;
  token?: string;
  refreshToken?: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  logout: () => void;
  login: (userData: any) => void;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
}

export interface RegistrationError {
  email?: string[];
  username?: string[];
  password?: string[];
  general?: string[];
  [key: string]: string[] | undefined;
}

export interface AuthFormProps {
  onSubmit: (formData: AuthFormData) => Promise<void>;
  isLogin?: boolean;
  errors?: RegistrationError;
}

```

# types\rhcp-types.ts

```ts
export interface SongStat {
  id: number;
  title: string;
  trackNumber: number;
  duration: string;
  publicAverage: number;
  reviewCount: number;
  groupAverage: number;
  groupReviewCount: number;
  currentUserRating?: number;
  selectedUserRating?: number;
  currentUserReviewId: number | null;
  userReviews?: UserReview[];
}

export interface Album {
  id: number;
  title: string;
  artworkUrl: string;
  releaseDate: string;
}

export interface UserReview {
  id: number;
  userId: number;
  songId: number;
  groupId?: number;
  author: { id: number; username: string; image?: string | null };
  rating: number;
  content: string;
  createdAt: string;
}

export interface GroupMember {
  id: number;
  username: string;
  email: string;
  image?: string | null;
  role: string;
  joinedAt: string;
}

export interface Group {
  id: number;
  name: string;
  description?: string | null;
  image?: string | null;
  isPrivate: boolean;
  memberCount: number;
  role: string;
  joinedAt: string;
  createdAt: string;
  inviteCode: string;
}

export interface FiltersState {
  groupId: string;
  userId: string;
  selectedUserId: string;
  selectedUserName: string;
}

export interface SongStatsProps {
  albumId: number;
  albumTitle: string;
  userId?: string;
  selectedUserId?: string;
  selectedUserName?: string;
  groups: Group[];
}

```

# utils\chartConfig.ts

```ts
import { Chart } from "chart.js";
import {
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register required components
Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Optional: Configure default settings
Chart.defaults.font.family = "Inter, sans-serif";
Chart.defaults.color = "#6b7280";

```

