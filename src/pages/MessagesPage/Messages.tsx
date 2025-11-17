import React, { useState, useEffect, useRef } from "react";
import { FiSend, FiMessageCircle, FiUser } from "react-icons/fi";
import { getStoredAuthToken, getAuthenticatedUserFromToken } from "../../lib/utils/auth.utils";
import { GET, POST } from "../../lib/utils/fetch.utils";
import {
  getConversations,
  getMessages,
  sendMessage,
} from "../../lib/api/messages.api";

const Messages: React.FC = () => {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [users, setUsers] = useState<{ [key: number]: any }>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentUser = getAuthenticatedUserFromToken<{
    userId?: number;
    id?: number;
    sub?: number | string;
  }>();

  const currentUserId =
    currentUser?.userId ??
    currentUser?.id ??
    (typeof currentUser?.sub === "string" ? Number(currentUser?.sub) : currentUser?.sub);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.conversationId);
      // Poll for new messages every 3 seconds
      const interval = setInterval(() => {
        loadMessages(selectedConversation.conversationId);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await getConversations();
      // fetch.utils returns: { status, response, message }
      // For conversations: response.response = { conversations: [...] }
      let convos: any[] = [];
      
      if (response?.response?.conversations) {
        convos = response.response.conversations;
      } else if (response?.data?.conversations) {
        convos = response.data.conversations;
      } else if (Array.isArray(response?.response)) {
        convos = response.response;
      } else if (Array.isArray(response?.data)) {
        convos = response.data;
      }

      setConversations(Array.isArray(convos) ? convos : []);
      
      // Load user data for participants
      const userIds = new Set<number>();
      convos.forEach((conv: any) => {
        if (conv.participant1Id && conv.participant1Id !== currentUserId) {
          userIds.add(conv.participant1Id);
        }
        if (conv.participant2Id && conv.participant2Id !== currentUserId) {
          userIds.add(conv.participant2Id);
        }
      });
      await loadUsers(Array.from(userIds));
    } catch (error) {
      console.error("Load conversations error:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: number) => {
    try {
      const response = await getMessages(conversationId);
      // fetch.utils returns: { status, response, message }
      // For messages: response.response = { messages: [...] }
      let msgs: any[] = [];
      
      if (response?.response?.messages) {
        msgs = response.response.messages;
      } else if (response?.data?.messages) {
        msgs = response.data.messages;
      } else if (Array.isArray(response?.response)) {
        msgs = response.response;
      } else if (Array.isArray(response?.data)) {
        msgs = response.data;
      }

      setMessages(Array.isArray(msgs) ? msgs : []);
    } catch (error) {
      console.error("Load messages error:", error);
    }
  };

  const loadUsers = async (userIds: number[]) => {
    const token = getStoredAuthToken();
    if (!token) return;

    const usersMap: { [key: number]: any } = { ...users };
    for (const userId of userIds) {
      if (usersMap[userId]) continue;
      try {
        const response = await GET<any>(`/users/${userId}/public`, "", token);
        let userData: any = null;
        if (response?.response) {
          userData = response.response;
        } else if (response?.data) {
          userData = response.data;
        } else if (response?.userId) {
          userData = response;
        }
        if (userData?.userId) {
          usersMap[userId] = {
            userId: userData.userId,
            firstName: userData.firstName || "",
            lastName: userData.lastName || "",
            profilePictureUrl: userData.profilePictureUrl,
          };
        }
      } catch (error) {
        console.error(`Failed to fetch user ${userId}:`, error);
      }
    }
    setUsers(usersMap);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      setSending(true);
      await sendMessage({
        conversationId: selectedConversation.conversationId,
        content: newMessage.trim(),
      });
      setNewMessage("");
      await loadMessages(selectedConversation.conversationId);
    } catch (error: any) {
      console.error("Send message error:", error);
      alert(error.response?.data?.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const getOtherParticipant = (conversation: any) => {
    const otherId =
      conversation.participant1Id === currentUserId
        ? conversation.participant2Id
        : conversation.participant1Id;
    return users[otherId] || null;
  };

  const getUserName = (userId: number): string => {
    const user = users[userId];
    if (!user) return "Unknown User";
    return `${user.firstName} ${user.lastName}`.trim() || "Unknown User";
  };

  const getUserInitials = (userId: number): string => {
    const user = users[userId];
    if (!user) return "U";
    const first = user.firstName?.[0] || "";
    const last = user.lastName?.[0] || "";
    return (first + last).toUpperCase() || "U";
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-200 via-white to-blue-200">
      <div className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden" style={{ height: "calc(100vh - 8rem)" }}>
          <div className="flex h-full">
            {/* Conversations List */}
            <div className="w-1/3 border-r border-gray-200 flex flex-col">
              <div className="p-4 border-b border-gray-200 bg-blue-50">
                <h2 className="text-xl font-bold text-gray-900">Messages</h2>
              </div>
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="p-4 text-center text-gray-500">Loading conversations...</div>
                ) : conversations.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <FiMessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>No conversations yet</p>
                  </div>
                ) : (
                  conversations.map((conversation: any) => {
                    const otherUser = getOtherParticipant(conversation);
                    return (
                      <button
                        key={conversation.conversationId}
                        type="button"
                        onClick={() => setSelectedConversation(conversation)}
                        className={`w-full p-4 border-b border-gray-100 hover:bg-gray-50 transition text-left ${
                          selectedConversation?.conversationId === conversation.conversationId
                            ? "bg-blue-50"
                            : ""
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                            {otherUser?.profilePictureUrl ? (
                              <img
                                src={otherUser.profilePictureUrl}
                                alt={getUserName(otherUser.userId)}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-blue-600 font-semibold">
                                {getUserInitials(otherUser?.userId || 0)}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {otherUser ? getUserName(otherUser.userId) : "Unknown User"}
                            </h3>
                            {conversation.lastMessage && (
                              <p className="text-sm text-gray-500 truncate">
                                {conversation.lastMessage.content}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              {selectedConversation ? (
                <>
                  <div className="p-4 border-b border-gray-200 bg-blue-50">
                    {(() => {
                      const otherUser = getOtherParticipant(selectedConversation);
                      return (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            {otherUser?.profilePictureUrl ? (
                              <img
                                src={otherUser.profilePictureUrl}
                                alt={getUserName(otherUser.userId)}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-blue-600 font-semibold text-sm">
                                {getUserInitials(otherUser?.userId || 0)}
                              </span>
                            )}
                          </div>
                          <h3 className="font-semibold text-gray-900">
                            {otherUser ? getUserName(otherUser.userId) : "Unknown User"}
                          </h3>
                        </div>
                      );
                    })()}
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((message: any) => {
                      const isOwn = message.senderId === currentUserId;
                      return (
                        <div
                          key={message.messageId}
                          className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              isOwn
                                ? "bg-blue-600 text-white"
                                : "bg-gray-100 text-gray-900"
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p
                              className={`text-xs mt-1 ${
                                isOwn ? "text-blue-100" : "text-gray-500"
                              }`}
                            >
                              {new Date(message.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                  <div className="p-4 border-t border-gray-200">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={sending}
                      />
                      <button
                        type="button"
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || sending}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <FiSend className="w-5 h-5" />
                        Send
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <FiMessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p>Select a conversation to start messaging</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;
