import { GET, POST } from "../utils/fetch.utils";
import { getStoredAuthToken } from "../utils/auth.utils";

export const getConversations = async () => {
  const token = getStoredAuthToken();
  return GET("/messages/conversations", "", token);
};

export const getMessages = async (conversationId: number) => {
  const token = getStoredAuthToken();
  return GET(`/messages/conversations/${conversationId}/messages`, "", token);
};

export const sendMessage = async (data: {
  conversationId: number;
  content: string;
}) => {
  const token = getStoredAuthToken();
  return POST("/messages", "", data, token);
};

export const createConversation = async (data: {
  participant1Id: number;
  participant2Id: number;
}) => {
  const token = getStoredAuthToken();
  return POST("/messages/conversations", "", data, token);
};
