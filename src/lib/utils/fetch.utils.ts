// src/lib/utils/fetch.utils.ts
import axios, { type AxiosResponse } from "axios";
import { RESPONSE } from "../utils/response.util";
import { API_BASE_URL } from "../api/config";

export const API = axios.create({
  baseURL: API_BASE_URL || "http://192.168.254.106:4444",
  withCredentials: true,
});

export const GET = async <T>(
  url: string,
  params: object = {},
  token?: string
) => {
  try {
    const response: AxiosResponse<T> = await API.get(url, {
      params,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return RESPONSE(response.status, response.data, "GET request successful");
  } catch (error: any) {
    return RESPONSE(
      error.response?.status || 500,
      {} as T,
      error.response?.data?.message || "GET request failed"
    );
  }
};

export const POST = async <T>(
  url: string,
  data: object = {},
  token?: string
) => {
  try {
    const response: AxiosResponse<T> = await API.post(url, data, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return RESPONSE(response.status, response.data, "POST request successful");
  } catch (error: any) {
    return RESPONSE(
      error.response?.status || 500,
      {} as T,
      error.response?.data?.message || "POST request failed"
    );
  }
};

export const PUT = async <T>(
  url: string,
  data: object = {},
  token?: string
) => {
  try {
    const response: AxiosResponse<T> = await API.put(url, data, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return RESPONSE(response.status, response.data, "PUT request successful");
  } catch (error: any) {
    return RESPONSE(
      error.response?.status || 500,
      {} as T,
      error.response?.data?.message || "PUT request failed"
    );
  }
};

export const PATCH = async <T>(
  url: string,
  data: object = {},
  token?: string
) => {
  try {
    const response: AxiosResponse<T> = await API.patch(url, data, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return RESPONSE(response.status, response.data, "PATCH request successful");
  } catch (error: any) {
    return RESPONSE(
      error.response?.status || 500,
      {} as T,
      error.response?.data?.message || "PATCH request failed"
    );
  }
};

export const DELETE = async <T>(
  url: string,
  data: object = {},
  token?: string
) => {
  try {
    const response: AxiosResponse<T> = await API.delete(url, {
      data,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return RESPONSE(
      response.status,
      response.data,
      "DELETE request successful"
    );
  } catch (error: any) {
    return RESPONSE(
      error.response?.status || 500,
      {} as T,
      error.response?.data?.message || "DELETE request failed"
    );
  }
};
