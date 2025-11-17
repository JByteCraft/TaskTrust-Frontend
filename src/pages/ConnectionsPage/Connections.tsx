import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FiUserPlus, FiCheck, FiX, FiUsers, FiUserCheck } from "react-icons/fi";
import {
  getMyConnections,
  getPendingRequests,
  acceptConnection,
  rejectConnection,
  removeConnection,
  sendConnectionRequest,
  getConnectionStatus,
} from "../../lib/api/connections.api";
import { getStoredAuthToken } from "../../lib/utils/auth.utils";
import { GET } from "../../lib/utils/fetch.utils";

type Connection = {
  connectionId: number;
  userId: number;
  status: string;
  createdAt: string;
};

type PendingRequest = {
  connectionId: number;
  requesterId: number;
  receiverId: number;
  status: string;
  createdAt: string;
};

type User = {
  userId: number;
  firstName: string;
  lastName: string;
  profilePictureUrl?: string;
  expertise?: string;
  city?: string;
  province?: string;
};

const Connections = () => {
  const navigate = useNavigate();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<PendingRequest[]>([]);
  const [users, setUsers] = useState<{ [key: number]: User }>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"connections" | "pending">("connections");
  const [pendingFilter, setPendingFilter] = useState<"all" | "received" | "sent">("all");

  useEffect(() => {
    const token = getStoredAuthToken();
    if (!token) {
      navigate("/login");
      return;
    }

    loadData();
  }, [navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadConnections(), loadPendingRequests()]);
    } catch (error) {
      console.error("Load data error:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadConnections = async () => {
    try {
      const response = await getMyConnections();
      
      // Extract connections from various response structures
      // Backend returns: { status: 200, response: [...], message: '...' }
      let connectionsData: any[] = [];
      if (response?.response && Array.isArray(response.response)) {
        connectionsData = response.response;
      } else if (response?.data?.response && Array.isArray(response.data.response)) {
        connectionsData = response.data.response;
      } else if (response?.data?.data && Array.isArray(response.data.data)) {
        connectionsData = response.data.data;
      } else if (Array.isArray(response?.data)) {
        connectionsData = response.data;
      } else if (Array.isArray(response)) {
        connectionsData = response;
      }
      
      const connectionsArray = Array.isArray(connectionsData) ? connectionsData : [];
      setConnections(connectionsArray);

      // Load user data
      const userIds = connectionsArray
        .map((c: any) => c.userId || c.receiverId || c.requesterId)
        .filter((id: any) => id !== null && id !== undefined);
      if (userIds.length > 0) {
        await loadUsers(userIds);
      }
    } catch (error) {
      console.error("Load connections error:", error);
    }
  };

  const loadPendingRequests = async () => {
    try {
      const response = await getPendingRequests();
      // GET returns: { status, response, message } or axios wraps it in { data: { status, response, message } }
      let requestsData: any[] = [];
      if (response?.response && Array.isArray(response.response)) {
        requestsData = response.response;
      } else if (response?.data?.response && Array.isArray(response.data.response)) {
        requestsData = response.data.response;
      } else if (response?.data?.data && Array.isArray(response.data.data)) {
        requestsData = response.data.data;
      } else if (Array.isArray(response?.data)) {
        requestsData = response.data;
      } else if (Array.isArray(response)) {
        requestsData = response;
      }
      
      const requestsArray = Array.isArray(requestsData) ? requestsData : [];
      
      // Separate received and sent requests
      const received = requestsArray.filter((r: any) => !r.isRequester);
      const sent = requestsArray.filter((r: any) => r.isRequester);
      
      setPendingRequests(received);
      setSentRequests(sent);

      // Load user data for both requesters and receivers
      const userIds = [
        ...received.map((r: any) => r.requesterId),
        ...sent.map((r: any) => r.receiverId),
      ].filter((id: any) => id !== null && id !== undefined);
      
      // Load users and wait for completion
      if (userIds.length > 0) {
        await loadUsers(userIds);
      }
    } catch (error) {
      console.error("Load pending requests error:", error);
    }
  };

  const loadUsers = async (userIds: number[]) => {
    if (userIds.length === 0) return;
    
    const token = getStoredAuthToken();
    if (!token) return;

    const usersMap: { [key: number]: User } = { ...users };
    const uniqueUserIds = [...new Set(userIds)];

    // Load all users in parallel for better performance
    const userPromises = uniqueUserIds
      .filter((userId) => !usersMap[userId]) // Skip already loaded users
      .map(async (userId) => {
        try {
          // Use public endpoint to avoid permission issues
          const response = await GET<any>(`/users/${userId}/public`, "", token);
          
          // GET returns: { status, response, message } or axios wraps it
          // Extract user data from various response structures
          let userData: any = null;
          if (response?.response && typeof response.response === 'object' && response.response.userId) {
            userData = response.response;
          } else if (response?.data?.response && typeof response.data.response === 'object' && response.data.response.userId) {
            userData = response.data.response;
          } else if (response?.data && typeof response.data === 'object' && response.data.userId) {
            userData = response.data;
          } else if (response?.userId) {
            userData = response;
          }
          
          if (userData && userData.userId) {
            return {
              userId: userData.userId,
              user: {
                userId: userData.userId,
                firstName: userData.firstName || "",
                lastName: userData.lastName || "",
                profilePictureUrl: userData.profilePictureUrl,
                expertise: userData.expertise,
                city: userData.city,
                province: userData.province,
              }
            };
          }
        } catch (error) {
          console.error(`Failed to load user ${userId}:`, error);
        }
        return null;
      });

    const userResults = await Promise.all(userPromises);
    
    // Update users map with loaded data
    userResults.forEach((result) => {
      if (result && result.user) {
        usersMap[result.userId] = result.user;
      }
    });

    setUsers(usersMap);
  };

  const handleAccept = async (connectionId: number) => {
    try {
      await acceptConnection(connectionId);
      await loadData();
    } catch (error: any) {
      console.error("Accept error:", error);
      alert(error.response?.data?.message || "Failed to accept connection");
    }
  };

  const handleReject = async (connectionId: number) => {
    try {
      await rejectConnection(connectionId);
      await loadData();
    } catch (error: any) {
      console.error("Reject error:", error);
      alert(error.response?.data?.message || "Failed to reject connection");
    }
  };

  const handleRemove = async (connectionId: number) => {
    if (!confirm("Are you sure you want to remove this connection?")) return;

    try {
      await removeConnection(connectionId);
      await loadData();
    } catch (error: any) {
      console.error("Remove error:", error);
      alert(error.response?.data?.message || "Failed to remove connection");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading connections...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-200 via-white to-blue-200 py-8">
      <div className="w-full max-w-full sm:max-w-none mx-auto px-4 sm:px-6 lg:px-12 xl:px-16">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Network</h1>
          <p className="text-gray-600">Manage your connections</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("connections")}
              className={`flex-1 px-6 py-4 font-medium text-center transition ${
                activeTab === "connections"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <FiUsers />
                Connections ({connections.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab("pending")}
              className={`flex-1 px-6 py-4 font-medium text-center transition ${
                activeTab === "pending"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <FiUserPlus />
                Pending ({pendingRequests.length + sentRequests.length})
              </div>
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === "connections" ? (
          <div>
            {connections.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <FiUsers className="mx-auto text-6xl text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg mb-4">No connections yet</p>
                <Link
                  to="/users"
                  className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
                >
                  Browse Users
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {connections.map((connection) => {
                  const user = users[connection.userId];
                  if (!user) return null;

                  return (
                    <div
                      key={connection.connectionId}
                      className="bg-white rounded-lg shadow-sm p-6"
                    >
                      <div className="flex items-start gap-4">
                        <div className="shrink-0">
                          <div className="w-16 h-16 rounded-full bg-blue-200 flex items-center justify-center overflow-hidden">
                            {user.profilePictureUrl ? (
                              <img
                                src={user.profilePictureUrl}
                                alt={`${user.firstName} ${user.lastName}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-blue-700 font-semibold text-xl">
                                {user.firstName.charAt(0)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex-1">
                          <Link
                            to={`/users/${user.userId}`}
                            className="font-semibold text-gray-900 hover:underline"
                          >
                            {user.firstName} {user.lastName}
                          </Link>
                          {user.expertise && (
                            <p className="text-sm text-gray-600 mt-1">
                              {user.expertise}
                            </p>
                          )}
                          {(user.city || user.province) && (
                            <p className="text-xs text-gray-500 mt-1">
                              {user.city && user.province
                                ? `${user.city}, ${user.province}`
                                : user.city || user.province}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleRemove(connection.connectionId)}
                          className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Unfriend"
                        >
                          Unfriend
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div>
            {/* Filter for pending requests */}
            <div className="mb-4 flex gap-2">
              <button
                onClick={() => setPendingFilter("all")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  pendingFilter === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All ({pendingRequests.length + sentRequests.length})
              </button>
              <button
                onClick={() => setPendingFilter("received")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  pendingFilter === "received"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Received ({pendingRequests.length})
              </button>
              <button
                onClick={() => setPendingFilter("sent")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  pendingFilter === "sent"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Sent ({sentRequests.length})
              </button>
            </div>

            {(() => {
              const filteredRequests =
                pendingFilter === "all"
                  ? [...pendingRequests, ...sentRequests]
                  : pendingFilter === "received"
                  ? pendingRequests
                  : sentRequests;

              if (filteredRequests.length === 0) {
                return (
                  <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                    <FiUserCheck className="mx-auto text-6xl text-gray-300 mb-4" />
                    <p className="text-gray-500 text-lg">
                      {pendingFilter === "all"
                        ? "No pending requests"
                        : pendingFilter === "received"
                        ? "No received requests"
                        : "No sent requests"}
                    </p>
                  </div>
                );
              }

              return (
                <div className="space-y-4">
                  {filteredRequests.map((request: any) => {
                    const isSent = request.isRequester || sentRequests.some((sr: any) => sr.connectionId === request.connectionId);
                    const userId = isSent ? request.receiverId : request.requesterId;
                    const user = users[userId];
                    
                    // Show loading placeholder if user data is not yet loaded
                    if (!user) {
                      return (
                        <div
                          key={request.connectionId}
                          className="bg-white rounded-lg shadow-sm p-6 animate-pulse"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-16 h-16 rounded-full bg-gray-200"></div>
                              <div>
                                <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                                <div className="h-3 bg-gray-200 rounded w-24"></div>
                              </div>
                            </div>
                            <div className="h-10 bg-gray-200 rounded w-20"></div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={request.connectionId}
                        className="bg-white rounded-lg shadow-sm p-6"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-blue-200 flex items-center justify-center overflow-hidden">
                              {user.profilePictureUrl ? (
                                <img
                                  src={user.profilePictureUrl}
                                  alt={`${user.firstName} ${user.lastName}`}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-blue-700 font-semibold text-xl">
                                  {user.firstName.charAt(0)}
                                </span>
                              )}
                            </div>
                            <div>
                              <Link
                                to={`/users/${user.userId}`}
                                className="font-semibold text-gray-900 hover:underline"
                              >
                                {user.firstName} {user.lastName}
                              </Link>
                              {user.expertise && (
                                <p className="text-sm text-gray-600">
                                  {user.expertise}
                                </p>
                              )}
                              <p className="text-xs text-gray-500 mt-1">
                                {isSent
                                  ? `Sent ${new Date(request.createdAt).toLocaleDateString()}`
                                  : `Received ${new Date(request.createdAt).toLocaleDateString()}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {isSent ? (
                              <button
                                onClick={() => handleRemove(request.connectionId)}
                                className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition"
                              >
                                <FiX />
                                Cancel
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleAccept(request.connectionId)}
                                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                >
                                  <FiCheck />
                                  Accept
                                </button>
                                <button
                                  onClick={() => handleReject(request.connectionId)}
                                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                                >
                                  <FiX />
                                  Reject
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
};

export default Connections;

