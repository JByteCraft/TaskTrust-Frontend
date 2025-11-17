// src/lib/api/notifications.api.ts
import { GET, PATCH, DELETE } from "../utils/fetch.utils";
import { getStoredAuthToken } from "../utils/auth.utils";

export const getNotifications = async (isRead?: boolean) => {
  const token = getStoredAuthToken();
  const params = isRead !== undefined ? `?isRead=${isRead}` : "";
  return GET(`/notifications${params}`, "", token);
};

export const markNotificationAsRead = async (notificationId: number) => {
  const token = getStoredAuthToken();
  return PATCH(`/notifications/${notificationId}/read`, "", {}, token);
};

export const markAllNotificationsAsRead = async () => {
  const token = getStoredAuthToken();
  return PATCH("/notifications/read-all", "", {}, token);
};

export const deleteNotification = async (notificationId: number) => {
  const token = getStoredAuthToken();
  return DELETE(`/notifications/${notificationId}`, "", {}, token);
};
