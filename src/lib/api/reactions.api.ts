// src/lib/api/reactions.api.ts
import axios from "axios";
import { API_BASE_URL } from "./config";
import { getAuthToken } from "../utils/auth.utils";

const getHeaders = () => ({
  headers: {
    Authorization: `Bearer ${getAuthToken()}`,
  },
});

export const createReaction = async (data: {
  targetType: "post" | "comment";
  targetId: number;
  reactionType: "like" | "love" | "celebrate" | "support";
}) => {
  return axios.post(`${API_BASE_URL}/reactions`, data, getHeaders());
};

export const getReactions = async (filters?: {
  targetType?: string;
  targetId?: number;
  userId?: number;
}) => {
  const params = new URLSearchParams();
  if (filters?.targetType) params.append("targetType", filters.targetType);
  if (filters?.targetId) params.append("targetId", filters.targetId.toString());
  if (filters?.userId) params.append("userId", filters.userId.toString());

  return axios.get(
    `${API_BASE_URL}/reactions?${params.toString()}`,
    getHeaders()
  );
};

export const getTargetReactions = async (targetType: string, targetId: number) => {
  return axios.get(
    `${API_BASE_URL}/reactions/target/${targetType}/${targetId}`,
    getHeaders()
  );
};

export const checkUserReaction = async (targetType: string, targetId: number) => {
  return axios.get(
    `${API_BASE_URL}/reactions/check/${targetType}/${targetId}`,
    getHeaders()
  );
};

export const deleteReaction = async (reactionId: number) => {
  return axios.delete(
    `${API_BASE_URL}/reactions/${reactionId}`,
    getHeaders()
  );
};

