// src/pages/NotificationsPage/Notifications.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiBell, FiCheck, FiX } from "react-icons/fi";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "../../lib/api/notifications.api";
import { getStoredAuthToken } from "../../lib/utils/auth.utils";

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

const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getStoredAuthToken();
    if (!token) {
      window.location.href = "/login";
      return;
    }
    loadNotifications();
  }, []);

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

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-200 via-white to-blue-200 py-4 sm:py-8">
      <div className="w-full max-w-full sm:max-w-none mx-auto px-4 sm:px-6 lg:px-12 xl:px-16">
        {/* Notifications List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Header inside notifications list */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-sm sm:text-base text-blue-600 hover:text-blue-700 font-medium px-3 sm:px-4 py-2 hover:bg-blue-50 rounded-lg transition"
              >
                Mark all as read
              </button>
            )}
          </div>
          {loading ? (
            <div className="p-8 sm:p-12 text-center">
              <p className="text-sm sm:text-base text-gray-500">
                Loading notifications...
              </p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 sm:p-12 text-center">
              <FiBell className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-sm sm:text-base text-gray-500">
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
                  }}
                  className={`block p-4 sm:p-6 hover:bg-gray-50 transition ${
                    !notification.isRead ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="text-2xl sm:text-3xl shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm sm:text-base text-gray-900 wrap-break-word mb-1">
                        {notification.message}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500">
                        {new Date(notification.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {!notification.isRead && (
                        <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-blue-600 rounded-full"></span>
                      )}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDelete(notification.notificationId);
                        }}
                        className="text-gray-400 hover:text-red-600 p-1 sm:p-2 rounded transition"
                        aria-label="Delete notification"
                        title="Delete notification"
                      >
                        <FiX className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;

