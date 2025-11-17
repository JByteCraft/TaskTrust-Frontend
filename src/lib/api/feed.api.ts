// src/lib/api/feed.api.ts
import axios from "axios";
import { API_BASE_URL } from "./config";
import { getAuthToken } from "../utils/auth.utils";

const getHeaders = () => ({
  headers: {
    Authorization: `Bearer ${getAuthToken()}`,
  },
});

export const getPersonalizedFeed = async (limit?: number, skip?: number) => {
  const params = new URLSearchParams();
  if (limit) params.append("limit", limit.toString());
  if (skip) params.append("skip", skip.toString());

  return axios.get(
    `${API_BASE_URL}/posts/feed/personalized?${params.toString()}`,
    getHeaders()
  );
};

export const getConnectionsFeed = async (limit?: number, skip?: number) => {
  const params = new URLSearchParams();
  if (limit) params.append("limit", limit.toString());
  if (skip) params.append("skip", skip.toString());

  return axios.get(
    `${API_BASE_URL}/posts/feed/connections?${params.toString()}`,
    getHeaders()
  );
};

export const getTrendingPosts = async (limit?: number, skip?: number) => {
  const params = new URLSearchParams();
  if (limit) params.append("limit", limit.toString());
  if (skip) params.append("skip", skip.toString());

  return axios.get(
    `${API_BASE_URL}/posts/feed/trending?${params.toString()}`,
    getHeaders()
  );
};

export const getJobFeed = async (limit?: number, skip?: number) => {
  const params = new URLSearchParams();
  if (limit) params.append("limit", limit.toString());
  if (skip) params.append("skip", skip.toString());

  return axios.get(
    `${API_BASE_URL}/posts/feed/jobs?${params.toString()}`,
    getHeaders()
  );
};

