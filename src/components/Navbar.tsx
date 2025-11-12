import type { FC } from "react";
import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiSearch,
  FiHome,
  FiUser,
  FiMessageCircle,
  FiUsers,
  FiBriefcase,
  FiBell,
  FiChevronDown,
} from "react-icons/fi";
import { getAuthenticatedUserFromToken, getStoredAuthToken } from "../lib/utils/auth.utils";
import { GET } from "../lib/utils/fetch.utils";

const navItems = [
  { icon: FiHome, label: "Home", path: "/" },
  { icon: FiUser, label: "Profile", path: "/profile" },
  { icon: FiMessageCircle, label: "Messaging", path: "/messages" },
  { icon: FiUsers, label: "Network", path: "/users" },
  { icon: FiBriefcase, label: "Jobs", path: "/jobs" },
];

const Navbar: FC = () => {
  const navigate = useNavigate();
  const [profilePictureUrl, setProfilePictureUrl] = useState<string>("");
  
  const authUser = getAuthenticatedUserFromToken<{
    firstName?: string;
    lastName?: string;
    middleName?: string;
    name?: string;
    role?: string;
    userId?: number;
    id?: number;
    sub?: number | string;
  }>();

  useEffect(() => {
    const fetchUserProfile = async () => {
      const token = getStoredAuthToken();
      if (!token || !authUser) return;

      const userId = authUser.userId ?? authUser.id ?? (typeof authUser.sub === "string" ? Number(authUser.sub) : authUser.sub);
      
      try {
        const response = await GET<any>(`/users/${userId}`, "", token);
        
        // Extract payload same way as Profile.tsx
        const payload =
          response?.data ||
          response?.profile ||
          response?.user ||
          response?.response ||
          response ||
          {};
        
        const picUrl = 
          payload?.profilePictureUrl ||
          payload?.avatarUrl ||
          payload?.avatar ||
          payload?.profileImage ||
          payload?.profilePicture ||
          "";
        
        setProfilePictureUrl(picUrl);
      } catch (err) {
        console.error("Failed to fetch profile picture:", err);
      }
    };

    fetchUserProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const displayName = useMemo(() => {
    if (!authUser) {
      return "You";
    }
    const names = [
      authUser.firstName,
      authUser.middleName,
      authUser.lastName,
    ].filter(Boolean);
    if (names.length) {
      return names[0] || "You";
    }
    if (authUser.name) {
      return authUser.name.split(" ")[0] || "You";
    }
    return "You";
  }, [authUser]);

  const initials = useMemo(() => {
    if (!authUser) {
      return "TT";
    }
    const names = [
      authUser.firstName,
      authUser.middleName,
      authUser.lastName,
    ].filter(Boolean);
    if (names.length) {
      return names
        .map((part) => part!.charAt(0).toUpperCase())
        .slice(0, 2)
        .join("");
    }
    if (authUser.name) {
      return authUser.name
        .split(" ")
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase())
        .slice(0, 2)
        .join("");
    }
    return "TT";
  }, [authUser]);

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white shadow-sm">
      <div className="flex h-14 w-full items-center justify-between gap-2 px-2 sm:h-16 sm:gap-3 sm:px-4 lg:px-6">
        <div className="flex flex-1 min-w-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="text-lg font-semibold tracking-tight text-blue-600 hover:text-blue-700 transition sm:text-xl lg:text-2xl whitespace-nowrap"
          >
            TaskTrust
          </button>
          <div className="hidden flex-1 md:block">
            <label
              htmlFor="navbar-search"
              className="sr-only"
            >
              Search TaskTrust
            </label>
            <div className="relative w-full max-w-xl">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-blue-500">
                <FiSearch className="h-5 w-5" aria-hidden="true" />
              </span>
              <input
                id="navbar-search"
                type="search"
                placeholder="Search on TaskTrust"
                className="w-full rounded-full border border-blue-100 bg-blue-50/60 py-2 pl-11 pr-4 text-sm text-gray-700 placeholder:text-blue-300 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>
        </div>

        <nav className="flex flex-none items-center gap-1 sm:gap-2 text-blue-500">
          <ul className="flex items-center gap-0.5 sm:gap-1">
            {navItems.map(({ icon: Icon, label, path }) => (
              <li key={label}>
                <button
                  type="button"
                  onClick={() => navigate(path)}
                  className="flex h-9 w-9 sm:h-10 sm:w-10 flex-col items-center justify-center gap-0.5 rounded-lg text-xs font-medium transition hover:bg-blue-50 hover:text-blue-600 focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:bg-blue-100"
                  aria-label={label}
                  title={label}
                >
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                  <span className="hidden text-[9px] tracking-wide md:block">
                    {label}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="relative flex h-9 w-9 sm:h-10 sm:w-10 flex-none items-center justify-center rounded-full text-blue-500 transition hover:bg-blue-50 hover:text-blue-600 focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:bg-blue-100"
            aria-label="Notifications"
            title="Notifications"
          >
            <FiBell className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
            <span className="sr-only">Notifications</span>
          </button>
          <div className="flex flex-none items-center">
            <button
              type="button"
              onClick={() => navigate("/profile")}
              className="flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50/60 px-2 py-1.5 sm:px-3 text-xs sm:text-sm font-medium text-blue-600 transition hover:border-blue-200 hover:bg-blue-100 focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:bg-blue-100"
            >
              <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center overflow-hidden rounded-full bg-blue-200">
                {profilePictureUrl ? (
                  <img
                    src={profilePictureUrl}
                    alt={displayName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-xs sm:text-sm font-semibold text-blue-700">
                    {initials}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline">{displayName}</span>
              <FiChevronDown className="h-3 w-3 sm:h-4 sm:w-4 hidden sm:block" aria-hidden="true" />
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;

