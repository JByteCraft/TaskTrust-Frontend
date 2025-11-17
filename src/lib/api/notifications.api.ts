// src/lib/api/notifications.api.ts
import axios from "axios";
import { API_BASE_URL } from "./config";
import { getAuthToken } from "../utils/auth.utils";

const getHeaders = () => ({
  headers: {
    Authorization: `Bearer ${getAuthToken()}`,
  },
});

export const getNotifications = async (isRead?: boolean) => {
  const params = new URLSearchParams();
  if (isRead !== undefined) params.append("isRead", isRead.toString());

  return axios.get(
    `${API_BASE_URL}/notifications?${params.toString()}`,
    getHeaders()
  );
};

export const markNotificationAsRead = async (notificationId: number) => {
  return axios.patch(
    `${API_BASE_URL}/notifications/${notificationId}/read`,
    {},
    getHeaders()
  );
};

export const markAllAsRead = async () => {
  return axios.patch(
    `${API_BASE_URL}/notifications/read-all`,
    {},
    getHeaders()
  );
};

export const deleteNotification = async (notificationId: number) => {
  return axios.delete(
    `${API_BASE_URL}/notifications/${notificationId}`,
    getHeaders()
  );
};

