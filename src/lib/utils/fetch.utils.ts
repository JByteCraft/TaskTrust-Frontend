// src/lib/utils/fetch.utils.ts
import axios, { type AxiosResponse } from "axios";
import { API_BASE_URL } from "../api/config";

const API = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export const GET = async <T = any>(
  url: string,
  params: string = "",
  token?: string
): Promise<T> => {
  try {
    const response: AxiosResponse<T> = await API.get(`${url}${params}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return response.data;
  } catch (error: any) {
    console.error("GET request error:", error);
    return (
      error.response?.data || { status: 500, message: "GET request failed" }
    );
  }
};

export const POST = async <T = any>(
  url: string,
  params: string = "",
  body: object = {},
  token?: string
): Promise<T> => {
  try {
    if (!API_BASE_URL) {
      console.error("API_BASE_URL is not configured");
      return { status: 500, message: "API base URL is not configured" } as T;
    }
    const response: AxiosResponse<T> = await API.post(`${url}${params}`, body, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return response.data;
  } catch (error: any) {
    console.error("POST request error:", error);
    console.error("Request URL:", `${API_BASE_URL}${url}${params}`);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status,
    });
    return (
      error.response?.data || { status: 500, message: "POST request failed" }
    );
  }
};

export const PUT = async <T = any>(
  url: string,
  params: string = "",
  body: object = {},
  token?: string
): Promise<T> => {
  try {
    const response: AxiosResponse<T> = await API.put(`${url}${params}`, body, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return response.data;
  } catch (error: any) {
    console.error("PUT request error:", error);
    return (
      error.response?.data || { status: 500, message: "PUT request failed" }
    );
  }
};

export const PATCH = async <T = any>(
  url: string,
  params: string = "",
  body: object = {},
  token?: string
): Promise<T> => {
  try {
    const response: AxiosResponse<T> = await API.patch(
      `${url}${params}`,
      body,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("PATCH request error:", error);
    return (
      error.response?.data || { status: 500, message: "PATCH request failed" }
    );
  }
};

export const DELETE = async <T = any>(
  url: string,
  params: string = "",
  body: object = {},
  token?: string
): Promise<T> => {
  try {
    const response: AxiosResponse<T> = await API.delete(`${url}${params}`, {
      data: body,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return response.data;
  } catch (error: any) {
    console.error("DELETE request error:", error);
    return (
      error.response?.data || { status: 500, message: "DELETE request failed" }
    );
  }
};
