// src/lib/api/applications.api.ts
import axios from "axios";
import { API_BASE_URL } from "./config";
import { getAuthToken } from "../utils/auth.utils";

const getHeaders = () => ({
  headers: {
    Authorization: `Bearer ${getAuthToken()}`,
  },
});

export const createApplication = async (data: {
  jobId: number;
  coverLetter?: string;
  proposedBudget?: number;
}) => {
  return axios.post(`${API_BASE_URL}/applications`, data, getHeaders());
};

export const getApplications = async (filters?: {
  jobId?: number;
  taskerId?: number;
  status?: string;
}) => {
  const params = new URLSearchParams();
  if (filters?.jobId) params.append("jobId", filters.jobId.toString());
  if (filters?.taskerId) params.append("taskerId", filters.taskerId.toString());
  if (filters?.status) params.append("status", filters.status);

  return axios.get(
    `${API_BASE_URL}/applications?${params.toString()}`,
    getHeaders()
  );
};

export const getMyApplications = async () => {
  return axios.get(`${API_BASE_URL}/applications/my-applications`, getHeaders());
};

export const getJobApplications = async (jobId: number) => {
  return axios.get(
    `${API_BASE_URL}/applications/job/${jobId}`,
    getHeaders()
  );
};

export const updateApplication = async (applicationId: number, data: any) => {
  return axios.patch(
    `${API_BASE_URL}/applications/${applicationId}`,
    data,
    getHeaders()
  );
};

export const deleteApplication = async (applicationId: number) => {
  return axios.delete(
    `${API_BASE_URL}/applications/${applicationId}`,
    getHeaders()
  );
};

