// src/lib/api/comments.api.ts
import axios from "axios";
import { API_BASE_URL } from "./config";
import { getAuthToken } from "../utils/auth.utils";

const getHeaders = () => ({
  headers: {
    Authorization: `Bearer ${getAuthToken()}`,
  },
});

export const createComment = async (data: {
  postId: number;
  content: string;
  parentCommentId?: number;
}) => {
  return axios.post(`${API_BASE_URL}/comments`, data, getHeaders());
};

export const getComments = async (filters?: {
  postId?: number;
  parentCommentId?: number;
  userId?: number;
}) => {
  const params = new URLSearchParams();
  if (filters?.postId) params.append("postId", filters.postId.toString());
  if (filters?.parentCommentId !== undefined) {
    params.append("parentCommentId", filters.parentCommentId?.toString() || "null");
  }
  if (filters?.userId) params.append("userId", filters.userId.toString());

  return axios.get(
    `${API_BASE_URL}/comments?${params.toString()}`,
    getHeaders()
  );
};

export const getPostComments = async (postId: number) => {
  return axios.get(
    `${API_BASE_URL}/comments/post/${postId}`,
    getHeaders()
  );
};

export const updateComment = async (commentId: number, data: { content: string }) => {
  return axios.patch(
    `${API_BASE_URL}/comments/${commentId}`,
    data,
    getHeaders()
  );
};

export const deleteComment = async (commentId: number) => {
  return axios.delete(
    `${API_BASE_URL}/comments/${commentId}`,
    getHeaders()
  );
};

