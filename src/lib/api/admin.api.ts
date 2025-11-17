// src/lib/api/admin.api.ts
import axios from "axios";
import { API_BASE_URL } from "./config";
import { getAuthToken } from "../utils/auth.utils";

const getHeaders = () => ({
  headers: {
    Authorization: `Bearer ${getAuthToken()}`,
  },
});

export const getAllUsers = async () => {
  return axios.get(`${API_BASE_URL}/users`, getHeaders());
};

export const getPendingVerifications = async () => {
  return axios.get(`${API_BASE_URL}/users/verifications/pending`, getHeaders());
};

export const verifyUserId = async (
  userId: number,
  action: "approved" | "rejected",
  rejectionReason?: string
) => {
  return axios.patch(
    `${API_BASE_URL}/users/${userId}/verify-id`,
    { action, rejectionReason },
    getHeaders()
  );
};

export const submitIdVerification = async (
  userId: number,
  data: {
    idImgUrl: string;
    selfieImgUrl: string;
    idType: string;
    idNumber: string;
  }
) => {
  return axios.post(
    `${API_BASE_URL}/users/${userId}/submit-verification`,
    data,
    getHeaders()
  );
};

