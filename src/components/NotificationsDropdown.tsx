// src/components/NotificationsDropdown.tsx
import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { FiCheck, FiX, FiBell } from "react-icons/fi";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "../lib/api/notifications.api";
import { useWebSocket } from "../lib/hooks/useWebSocket";

type Notification = {
  notificationId: number;
  type: string;
  fromUserId: number;
  message: string;
  isRead: boolean;
  targetId?: number;
  targetType?: string;
  createdAt: string;
};

type NotificationsDropdownProps = {
  isOpen: boolean;
  onClose: () => void;
  onUnreadCountChange?: (count: number) => void;
};

const NotificationsDropdown = ({
  isOpen,
  onClose,
  onUnreadCountChange,
}: NotificationsDropdownProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Real-time notification handler
  const handleRealTimeNotification = (notification: Notification) => {
    setNotifications((prev) => [notification, ...prev]);
    setUnreadCount((prev) => prev + 1);
    if (onUnreadCountChange) {
      onUnreadCountChange(unreadCount + 1);
    }
  };

  // Setup WebSocket for real-time notifications
  useWebSocket({
    onNotification: handleRealTimeNotification,
  });

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await getNotifications();
      // Backend returns: { status: 200, response: { notifications, unreadCount }, message: '...' }
      let responseData: any = {};
      if (response?.response && typeof response.response === 'object') {
        responseData = response.response;
      } else if (response?.data?.response && typeof response.data.response === 'object') {
        responseData = response.data.response;
      } else if (response?.data && typeof response.data === 'object') {
        responseData = response.data;
      } else if (Array.isArray(response?.response)) {
        responseData = { notifications: response.response };
      } else if (Array.isArray(response?.data)) {
        responseData = { notifications: response.data };
      } else if (Array.isArray(response)) {
        responseData = { notifications: response };
      }
      
      const notificationsList = Array.isArray(responseData.notifications)
        ? responseData.notifications
        : Array.isArray(responseData)
        ? responseData
        : [];
      setNotifications(notificationsList);
      
      const unread =
        responseData.unreadCount ||
        notificationsList.filter((n: Notification) => !n.isRead).length;
      setUnreadCount(unread);
      if (onUnreadCountChange) {
        onUnreadCountChange(responseData.unreadCount || unread);
      }
    } catch (error) {
      console.error("Load notifications error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.notificationId === notificationId
            ? { ...notif, isRead: true }
            : notif
        )
      );
      const newCount = Math.max(0, unreadCount - 1);
      setUnreadCount(newCount);
      if (onUnreadCountChange) {
        onUnreadCountChange(newCount);
      }
    } catch (error) {
      console.error("Mark as read error:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, isRead: true }))
      );
      setUnreadCount(0);
      if (onUnreadCountChange) {
        onUnreadCountChange(0);
      }
    } catch (error) {
      console.error("Mark all as read error:", error);
    }
  };

  const handleDelete = async (notificationId: number) => {
    try {
      await deleteNotification(notificationId);
      const deletedNotif = notifications.find(
        (n) => n.notificationId === notificationId
      );
      setNotifications((prev) =>
        prev.filter((notif) => notif.notificationId !== notificationId)
      );
      if (deletedNotif && !deletedNotif.isRead) {
        const newCount = Math.max(0, unreadCount - 1);
        setUnreadCount(newCount);
        if (onUnreadCountChange) {
          onUnreadCountChange(newCount);
        }
      }
    } catch (error) {
      console.error("Delete notification error:", error);
    }
  };

  const getNotificationLink = (notification: Notification): string => {
    if (notification.targetType === "post" && notification.targetId) {
      return "/feed";
    }
    if (notification.targetType === "job" && notification.targetId) {
      return `/jobs/${notification.targetId}`;
    }
    if (
      notification.type === "connection_request" ||
      notification.type === "connection_accepted"
    ) {
      return `/users/${notification.fromUserId}`;
    }
    if (
      notification.type === "application_accepted" ||
      notification.type === "application_rejected"
    ) {
      return "/applications/my-applications";
    }
    return "#";
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "connection_request":
      case "connection_accepted":
        return "👥";
      case "like":
        return "❤️";
      case "comment":
        return "💬";
      case "application_accepted":
        return "✅";
      case "application_rejected":
        return "❌";
      case "job_match":
        return "🎯";
      default:
        return "🔔";
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute max-sm:top-10 top-12 right-0 mt-2 w-[calc(100vw-0.5rem)] sm:w-80 md:w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-[calc(100vh-8rem)] sm:max-h-96 overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200">
        <h3 className="text-xs sm:text-sm md:text-base font-semibold text-gray-900">
          Notifications
        </h3>
        <div className="flex items-center gap-1 sm:gap-2">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              className="text-[10px] sm:text-xs text-blue-600 hover:text-blue-700 font-medium px-1 sm:px-0"
            >
              Mark all read
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
            aria-label="Close notifications"
            title="Close notifications"
          >
            <FiX className="w-3 h-3 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="overflow-y-auto flex-1">
        {loading ? (
          <div className="p-3 sm:p-4 text-center text-xs sm:text-sm text-gray-500">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-6 sm:p-8 text-center">
            <FiBell className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-xs sm:text-sm text-gray-500">
              No notifications yet
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <Link
                key={notification.notificationId}
                to={getNotificationLink(notification)}
                onClick={() => {
                  if (!notification.isRead) {
                    handleMarkAsRead(notification.notificationId);
                  }
                  onClose();
                }}
                className={`block p-2.5 sm:p-3 md:p-4 hover:bg-gray-50 transition ${
                  !notification.isRead ? "bg-blue-50" : ""
                }`}
              >
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="text-base sm:text-lg shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-gray-900 line-clamp-2 wrap-break-words">
                      {notification.message}
                    </p>
                    <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">
                      {new Date(notification.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!notification.isRead && (
                      <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-600 rounded-full"></span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDelete(notification.notificationId);
                      }}
                      className="text-gray-400 hover:text-red-600 p-0.5 sm:p-1"
                      aria-label="Delete notification"
                      title="Delete notification"
                    >
                      <FiX className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsDropdown;
