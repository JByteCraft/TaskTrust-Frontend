import { GET } from "../utils/fetch.utils";
import { getStoredAuthToken } from "../utils/auth.utils";

export const generateResume = async (userId: number) => {
  const token = getStoredAuthToken();
  return GET(`/users/${userId}/resume`, "", token);
};
