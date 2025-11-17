// src/lib/api/education.api.ts
import { GET, POST, PATCH, DELETE } from "../utils/fetch.utils";
import { getStoredAuthToken } from "../utils/auth.utils";

export const getEducationRecords = async (userId?: number) => {
  const token = getStoredAuthToken();
  const params = userId ? `?userId=${userId}` : "";
  return GET(`/education${params}`, "", token);
};

export const createEducationRecord = async (data: any) => {
  const token = getStoredAuthToken();
  return POST("/education", "", data, token);
};

export const updateEducationRecord = async (educationId: number, data: any) => {
  const token = getStoredAuthToken();
  return PATCH(`/education/${educationId}`, "", data, token);
};

export const deleteEducationRecord = async (educationId: number) => {
  const token = getStoredAuthToken();
  return DELETE(`/education/${educationId}`, "", {}, token);
};

