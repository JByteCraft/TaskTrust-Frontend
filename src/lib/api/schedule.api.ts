// src/lib/api/schedule.api.ts
import { GET, PATCH } from "../utils/fetch.utils";
import { getStoredAuthToken } from "../utils/auth.utils";

export const getSchedule = async () => {
  const token = getStoredAuthToken();
  return GET("/schedule", "", token);
};

export const updateSchedule = async (weeklySchedule: any) => {
  const token = getStoredAuthToken();
  return PATCH("/schedule", "", { weeklySchedule }, token);
};

