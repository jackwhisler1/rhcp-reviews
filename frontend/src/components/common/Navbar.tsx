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
      <div className="flex-1"></div>

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
