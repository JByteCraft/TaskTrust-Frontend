// src/lib/api/jobs.api.ts
import axios from "axios";
import { API_BASE_URL } from "./config";
import { getAuthToken } from "../utils/auth.utils";

const getHeaders = () => ({
  headers: {
    Authorization: `Bearer ${getAuthToken()}`,
  },
});

export const createJob = async (data: any) => {
  return axios.post(`${API_BASE_URL}/jobs`, data, getHeaders());
};

export const getJobs = async (filters?: {
  status?: string;
  city?: string;
  province?: string;
  minBudget?: number;
  maxBudget?: number;
  skills?: string[];
}) => {
  const params = new URLSearchParams();
  if (filters?.status) params.append("status", filters.status);
  if (filters?.city) params.append("city", filters.city);
  if (filters?.province) params.append("province", filters.province);
  if (filters?.minBudget) params.append("minBudget", filters.minBudget.toString());
  if (filters?.maxBudget) params.append("maxBudget", filters.maxBudget.toString());
  if (filters?.skills) params.append("skills", filters.skills.join(","));

  return axios.get(`${API_BASE_URL}/jobs?${params.toString()}`, getHeaders());
};

export const getJob = async (jobId: number) => {
  return axios.get(`${API_BASE_URL}/jobs/${jobId}`, getHeaders());
};

export const getMyJobs = async () => {
  return axios.get(`${API_BASE_URL}/jobs/my-jobs`, getHeaders());
};

export const updateJob = async (jobId: number, data: any) => {
  return axios.patch(`${API_BASE_URL}/jobs/${jobId}`, data, getHeaders());
};

export const deleteJob = async (jobId: number) => {
  return axios.delete(`${API_BASE_URL}/jobs/${jobId}`, getHeaders());
};

export const getJobMatches = async (jobId: number) => {
  return axios.get(`${API_BASE_URL}/jobs/${jobId}/matches`, getHeaders());
};

export const getTaskerMatches = async () => {
  return axios.get(`${API_BASE_URL}/jobs/matches/for-tasker`, getHeaders());
};

export const getMatchPercentage = async (jobId: number, taskerId: number) => {
  return axios.get(
    `${API_BASE_URL}/jobs/${jobId}/match/${taskerId}`,
    getHeaders()
  );
};

