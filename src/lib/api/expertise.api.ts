// src/lib/api/expertise.api.ts
import { GET } from "../utils/fetch.utils";
import { getStoredAuthToken } from "../utils/auth.utils";

export const getAllExpertise = async () => {
  const token = getStoredAuthToken();
  return GET("/users/expertise/all", "", token);
};

