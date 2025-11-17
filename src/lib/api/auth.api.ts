// src/lib/api/auth.api.ts
import axios from "axios";
import { API_BASE_URL } from "./config";

export const register = async (data: any) => {
  return axios.post(`${API_BASE_URL}/auth/register`, data);
};

export const resendOtp = async (email: string) => {
  return axios.post(`${API_BASE_URL}/auth/resend-otp-register`, { email });
};

export const verifyOtp = async (email: string, otp: string, userData: any) => {
  return axios.post(`${API_BASE_URL}/auth/verify-otp-register`, {
    email,
    otp,
    userData,
  });
};

export const forgotPassword = async (email: string) => {
  return axios.post(`${API_BASE_URL}/auth/forgot-password`, { email });
};

export const resetPassword = async (token: string, newPassword: string) => {
  return axios.post(`${API_BASE_URL}/auth/reset-password`, {
    token,
    newPassword,
  });
};