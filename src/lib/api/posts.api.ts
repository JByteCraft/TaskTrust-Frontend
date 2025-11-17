// src/lib/api/posts.api.ts
import axios from "axios";
import { API_BASE_URL } from "./config";
import { getAuthToken } from "../utils/auth.utils";

const getHeaders = () => ({
  headers: {
    Authorization: `Bearer ${getAuthToken()}`,
  },
});

export const createPost = async (data: {
  content: string;
  images?: string[];
  videos?: string[];
  visibility?: string;
}) => {
  return axios.post(`${API_BASE_URL}/posts`, data, getHeaders());
};

export const getPosts = async (filters?: {
  userId?: number;
  visibility?: string;
  limit?: number;
  skip?: number;
}) => {
  const params = new URLSearchParams();
  if (filters?.userId) params.append("userId", filters.userId.toString());
  if (filters?.visibility) params.append("visibility", filters.visibility);
  if (filters?.limit) params.append("limit", filters.limit.toString());
  if (filters?.skip) params.append("skip", filters.skip.toString());

  return axios.get(`${API_BASE_URL}/posts?${params.toString()}`, getHeaders());
};

export const getPost = async (postId: number) => {
  return axios.get(`${API_BASE_URL}/posts/${postId}`, getHeaders());
};

export const getMyPosts = async () => {
  return axios.get(`${API_BASE_URL}/posts/my-posts`, getHeaders());
};

export const getUserPosts = async (userId: number) => {
  return axios.get(`${API_BASE_URL}/posts/user/${userId}`, getHeaders());
};

export const updatePost = async (postId: number, data: any) => {
  return axios.patch(`${API_BASE_URL}/posts/${postId}`, data, getHeaders());
};

export const deletePost = async (postId: number) => {
  return axios.delete(`${API_BASE_URL}/posts/${postId}`, getHeaders());
};

