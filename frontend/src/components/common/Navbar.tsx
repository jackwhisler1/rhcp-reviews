import React, { useState, useRef, useEffect } from "react";
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
    <Menu as="div" className="relative ml-4">
      <MenuButton className="flex items-center gap-x-1 text-sm font-semibold leading-6 text-gray-900 hover:text-gray-700">
        <span>Welcome back, {safeUsername}</span>
        <ChevronDownIcon className="h-5 w-5" aria-hidden="true" />
      </MenuButton>

      <MenuItems className="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
        <div className="py-1">
          <MenuItem>
            {({ active }: { active: boolean }) => (
              <Link
                to="/profile"
                className={`${
                  active ? "bg-gray-100 text-gray-900" : "text-gray-700"
                } block px-4 py-2 text-sm`}
              >
                Profile
              </Link>
            )}
          </MenuItem>
          <MenuItem>
            {({ active }: { active: boolean }) => (
              <Link
                to="/dashboard"
                className={`${
                  active ? "bg-gray-100 text-gray-900" : "text-gray-700"
                } block px-4 py-2 text-sm`}
              >
                Dashboard
              </Link>
            )}
          </MenuItem>
          <MenuItem>
            {({ active }: { active: boolean }) => (
              <Link
                to="/settings"
                className={`${
                  active ? "bg-gray-100 text-gray-900" : "text-gray-700"
                } block px-4 py-2 text-sm`}
              >
                Settings
              </Link>
            )}
          </MenuItem>
          <MenuItem>
            {({ active }) => (
              <button
                onClick={() => {
                  logout();
                  // Add redirect if needed
                  window.location.href = "/login";
                }}
                className={`${
                  active ? "bg-gray-100 text-gray-900" : "text-gray-700"
                } w-full text-left block px-4 py-2 text-sm`}
              >
                Logout
              </button>
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
    <nav className="mx-auto flex items-center justify-between p-6 lg:px-8">
      {/* Logo */}
      <div className="flex lg:flex-1">
        <Link to="/" className="-m-1.5 p-1.5">
          <Logo className="h-8 w-auto" />
        </Link>
      </div>

      {/* Navigation Links */}
      <div className="flex flex-1 justify-end gap-x-4">
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
