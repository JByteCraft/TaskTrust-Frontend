import { GET, POST, PATCH, DELETE } from "../utils/fetch.utils";
import { getStoredAuthToken } from "../utils/auth.utils";

export const getPortfolioItems = async (userId: number) => {
  const token = getStoredAuthToken();
  return GET(`/portfolio?userId=${userId}`, "", token);
};

export const createPortfolioItem = async (data: any) => {
  const token = getStoredAuthToken();
  return POST("/portfolio", "", data, token);
};

export const updatePortfolioItem = async (portfolioId: number, data: any) => {
  const token = getStoredAuthToken();
  return PATCH(`/portfolio/${portfolioId}`, "", data, token);
};

export const deletePortfolioItem = async (portfolioId: number) => {
  const token = getStoredAuthToken();
  return DELETE(`/portfolio/${portfolioId}`, "", token);
};
