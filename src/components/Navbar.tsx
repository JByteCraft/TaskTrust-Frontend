import type { FC } from "react";
import { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiSearch,
  FiHome,
  FiUser,
  FiMessageCircle,
  FiRss,
  FiUsers,
  FiBriefcase,
  FiBell,
  FiChevronDown,
  FiLogOut,
} from "react-icons/fi";
import { getAuthenticatedUserFromToken, getStoredAuthToken, clearStoredAuthToken } from "../lib/utils/auth.utils";
import { GET } from "../lib/utils/fetch.utils";
import NotificationsDropdown from "./NotificationsDropdown";
import { getNotifications } from "../lib/api/notifications.api";

const navItems = [
  { icon: FiHome, label: "Home", path: "/" },
  { icon: FiUser, label: "Profile", path: "/profile" },
  { icon: FiRss, label: "Feed", path: "/feed" },
  { icon: FiUsers, label: "Network", path: "/connections" },
  { icon: FiBriefcase, label: "Jobs", path: "/jobs" },
  { icon: FiMessageCircle, label: "Messages", path: "/messages" },
];

const Navbar: FC = () => {
  const navigate = useNavigate();
  const [profilePictureUrl, setProfilePictureUrl] = useState<string>("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const userMenuRef = useRef<HTMLDivElement>(null);
  
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

  // Load unread notification count
  useEffect(() => {
    const loadUnreadCount = async () => {
      const token = getStoredAuthToken();
      if (!token) return;

      try {
        const response = await getNotifications(false); // Get only unread
        // Backend returns: { status: 200, response: { notifications, unreadCount }, message: '...' }
        const responseData = response?.response || response?.data?.response || response?.data || response || {};
        const notificationsList = Array.isArray(responseData.notifications)
          ? responseData.notifications
          : Array.isArray(responseData)
          ? responseData
          : [];
        const unread = notificationsList.filter((n: any) => !n.isRead).length;
        setUnreadCount(responseData.unreadCount || unread || 0);
      } catch (error) {
        console.error("Load unread count error:", error);
      }
    };

    loadUnreadCount();
    // Refresh every 30 seconds
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showUserMenu]);

  const handleLogout = () => {
    clearStoredAuthToken();
    navigate("/login");
  };

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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && searchQuery.trim()) {
                    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                    setSearchQuery("");
                  }
                }}
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
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                // On mobile, navigate to notifications page
                // On desktop, show dropdown
                if (window.innerWidth < 640) {
                  navigate("/notifications");
                } else {
                  setShowNotifications(!showNotifications);
                }
              }}
              className="relative flex h-9 w-9 sm:h-10 sm:w-10 flex-none items-center justify-center rounded-full text-blue-500 transition hover:bg-blue-50 hover:text-blue-600 focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:bg-blue-100"
              aria-label="Notifications"
              title="Notifications"
            >
              <FiBell className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
              <span className="sr-only">Notifications</span>
            </button>
            {/* Only show dropdown on desktop (sm and above) */}
            <div className="hidden sm:block">
              <NotificationsDropdown
                isOpen={showNotifications}
                onClose={() => setShowNotifications(false)}
                onUnreadCountChange={setUnreadCount}
              />
            </div>
          </div>
          <div className="relative flex flex-none items-center" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setShowUserMenu(!showUserMenu)}
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
            
            {/* User Menu Dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 sm:w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
                <button
                  type="button"
                  onClick={() => {
                    navigate("/profile");
                    setShowUserMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition"
                >
                  <FiUser className="h-4 w-4 text-gray-500" />
                  <span>View Profile</span>
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 transition"
                >
                  <FiLogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;

