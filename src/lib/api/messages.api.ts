import { GET, POST, PATCH } from "../utils/fetch.utils";
import { getStoredAuthToken } from "../utils/auth.utils";

export const getConversations = async () => {
  const token = getStoredAuthToken();
  return GET("/messages/conversations", "", token);
};

export const getMessages = async (conversationId: number) => {
  const token = getStoredAuthToken();
  return GET(`/messages/conversation/${conversationId}`, "", token);
};

export const sendMessage = async (data: {
  receiverId: number;
  content: string;
  conversationId?: number;
}) => {
  const token = getStoredAuthToken();
  return POST("/messages", "", data, token);
};

export const markMessageAsRead = async (messageId: number) => {
  const token = getStoredAuthToken();
  return PATCH(`/messages/${messageId}/read`, "", {}, token);
};
