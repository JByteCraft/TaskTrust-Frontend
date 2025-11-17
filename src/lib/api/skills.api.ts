import { GET } from "../utils/fetch.utils";
import { getStoredAuthToken } from "../utils/auth.utils";

export const getAllSkills = async () => {
  const token = getStoredAuthToken();
  return GET("/users/skills/all", "", token);
};

