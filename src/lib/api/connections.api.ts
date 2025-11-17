// src/lib/api/connections.api.ts
import axios from "axios";
import { API_BASE_URL } from "./config";
import { getAuthToken } from "../utils/auth.utils";

const getHeaders = () => ({
  headers: {
    Authorization: `Bearer ${getAuthToken()}`,
  },
});

export const sendConnectionRequest = async (receiverId: number) => {
  return axios.post(
    `${API_BASE_URL}/connections/request`,
    { receiverId },
    getHeaders()
  );
};

export const getConnections = async (filters?: {
  userId?: number;
  status?: string;
  type?: "sent" | "received" | "all";
}) => {
  const params = new URLSearchParams();
  if (filters?.userId) params.append("userId", filters.userId.toString());
  if (filters?.status) params.append("status", filters.status);
  if (filters?.type) params.append("type", filters.type);

  return axios.get(
    `${API_BASE_URL}/connections?${params.toString()}`,
    getHeaders()
  );
};

export const getMyConnections = async () => {
  return axios.get(`${API_BASE_URL}/connections/my-connections`, getHeaders());
};

export const getPendingRequests = async () => {
  return axios.get(`${API_BASE_URL}/connections/pending`, getHeaders());
};

export const getConnectionStatus = async (userId: number) => {
  return axios.get(
    `${API_BASE_URL}/connections/status/${userId}`,
    getHeaders()
  );
};

export const acceptConnection = async (connectionId: number) => {
  return axios.patch(
    `${API_BASE_URL}/connections/${connectionId}/accept`,
    {},
    getHeaders()
  );
};

export const rejectConnection = async (connectionId: number) => {
  return axios.patch(
    `${API_BASE_URL}/connections/${connectionId}/reject`,
    {},
    getHeaders()
  );
};

export const blockUser = async (userId: number) => {
  return axios.post(
    `${API_BASE_URL}/connections/block/${userId}`,
    {},
    getHeaders()
  );
};

export const removeConnection = async (connectionId: number) => {
  return axios.delete(
    `${API_BASE_URL}/connections/${connectionId}`,
    getHeaders()
  );
};

