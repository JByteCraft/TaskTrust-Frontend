import { GET, POST } from "../utils/fetch.utils";
import { getStoredAuthToken } from "../utils/auth.utils";

export const getTaskerReviews = async (taskerId: number) => {
  const token = getStoredAuthToken();
  return GET(`/reviews/tasker/${taskerId}`, "", token);
};

export const getTaskerStats = async (taskerId: number) => {
  const token = getStoredAuthToken();
  return GET(`/reviews/tasker/${taskerId}/stats`, "", token);
};

export const createReview = async (data: {
  taskerId: number;
  jobId?: number;
  rating: number;
  comment?: string;
}) => {
  const token = getStoredAuthToken();
  return POST("/reviews", "", data, token);
};
