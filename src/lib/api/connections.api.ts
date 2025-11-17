// src/lib/api/connections.api.ts
import { GET, POST, PATCH, DELETE } from "../utils/fetch.utils";
import { getStoredAuthToken } from "../utils/auth.utils";

export const sendConnectionRequest = async (receiverId: number) => {
  const token = getStoredAuthToken();
  return POST("/connections/request", "", { receiverId }, token);
};

export const getConnections = async (filters?: {
  userId?: number;
  status?: string;
  type?: "sent" | "received" | "all";
}) => {
  const token = getStoredAuthToken();
  const params = new URLSearchParams();
  if (filters?.userId) params.append("userId", filters.userId.toString());
  if (filters?.status) params.append("status", filters.status);
  if (filters?.type) params.append("type", filters.type);
  
  const queryString = params.toString();
  return GET(`/connections${queryString ? `?${queryString}` : ""}`, "", token);
};

export const getMyConnections = async () => {
  const token = getStoredAuthToken();
  return GET("/connections/my-connections", "", token);
};

export const getPendingRequests = async () => {
  const token = getStoredAuthToken();
  return GET("/connections/pending", "", token);
};

export const getConnectionStatus = async (userId: number) => {
  const token = getStoredAuthToken();
  return GET(`/connections/status/${userId}`, "", token);
};

export const acceptConnection = async (connectionId: number) => {
  const token = getStoredAuthToken();
  return PATCH(`/connections/${connectionId}/accept`, "", {}, token);
};

export const rejectConnection = async (connectionId: number) => {
  const token = getStoredAuthToken();
  return PATCH(`/connections/${connectionId}/reject`, "", {}, token);
};

export const blockUser = async (userId: number) => {
  const token = getStoredAuthToken();
  return POST(`/connections/block/${userId}`, "", {}, token);
};

export const removeConnection = async (connectionId: number) => {
  const token = getStoredAuthToken();
  return DELETE(`/connections/${connectionId}`, "", {}, token);
};

