import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch, FiFilter, FiUser, FiStar, FiUserPlus, FiUserCheck, FiX, FiCheckCircle } from "react-icons/fi";
import { GET } from "../../lib/utils/fetch.utils";
import { getStoredAuthToken, getAuthenticatedUserFromToken } from "../../lib/utils/auth.utils";
import { sendConnectionRequest, getConnectionStatus, acceptConnection, rejectConnection, removeConnection } from "../../lib/api/connections.api";

type UserCard = {
  userId: number;
  firstName: string;
  lastName: string;
  middleName?: string;
  role: string;
  expertise?: string;
  profilePictureUrl?: string;
  rating?: number;
  skills?: string[];
  city?: string;
  province?: string;
  isLegit?: boolean;
};

const BrowseUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserCard[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [connectionStatuses, setConnectionStatuses] = useState<{ [key: number]: any }>({});
  const [connecting, setConnecting] = useState<number | null>(null);

  const currentUser = getAuthenticatedUserFromToken<{ userId: number }>();

  useEffect(() => {
    const fetchUsers = async () => {
      const token = getStoredAuthToken();
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        setLoading(true);
        const response = await GET<any>("/users", "", token);
        
        // fetch.utils returns: { status, response, message }
        // Backend RESPONSE utility returns: { status, response: users[], message }
        let usersData: any[] = [];
        
        if (response?.response && Array.isArray(response.response)) {
          usersData = response.response;
        } else if (response?.data && Array.isArray(response.data)) {
          usersData = response.data;
        } else if (response?.users && Array.isArray(response.users)) {
          usersData = response.users;
        } else if (Array.isArray(response)) {
          usersData = response;
        }
        
        // Filter out the current logged-in user
        const filteredData = usersData.filter((user: any) => user.userId !== currentUser?.userId);
        
        setUsers(filteredData);
        setFilteredUsers(filteredData);
      } catch (err: any) {
        console.error("Fetch users error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [navigate]);

  useEffect(() => {
    // Load connection statuses for all users
    if (filteredUsers.length > 0 && currentUser?.userId) {
      loadConnectionStatuses();
    }
  }, [filteredUsers, currentUser]);

  const loadConnectionStatuses = async () => {
    if (!currentUser?.userId) return;

    const statuses: { [key: number]: any } = {};
    for (const user of filteredUsers) {
      if (user.userId === currentUser.userId) continue;
      try {
        const response = await getConnectionStatus(user.userId);
        // fetch.utils returns: { status, response, message }
        // Backend RESPONSE utility returns: { status, response: {...}, message }
        let statusData: any = { status: "none" };
        
        if (response?.response) {
          statusData = response.response;
        } else if (response?.data) {
          statusData = response.data;
        } else if (response?.status) {
          statusData = response;
        }
        
        statuses[user.userId] = statusData;
      } catch (error) {
        // User might not have connection status yet
        statuses[user.userId] = { status: "none" };
      }
    }
    setConnectionStatuses(statuses);
  };

  const handleConnect = async (userId: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    if (connecting === userId) return;

    setConnecting(userId);
    try {
      const response = await sendConnectionRequest(userId);
      // Check if request was successful
      if (response?.status === 200 || response?.status === 201 || response?.response) {
        await loadConnectionStatuses();
        alert("Connection request sent!");
      } else {
        const errorMsg = response?.message || "Failed to send connection request";
        alert(errorMsg);
      }
    } catch (error: any) {
      console.error("Connect error:", error);
      const errorMsg = error?.response?.data?.message || 
                       error?.response?.message || 
                       error?.message || 
                       "Failed to send connection request";
      alert(errorMsg);
    } finally {
      setConnecting(null);
    }
  };

  useEffect(() => {
    let result = [...users];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((user) => {
        const fullName = `${user.firstName} ${user.middleName || ""} ${user.lastName}`.toLowerCase();
        const expertise = user.expertise?.toLowerCase() || "";
        const skills = user.skills?.join(" ").toLowerCase() || "";
        return fullName.includes(query) || expertise.includes(query) || skills.includes(query);
      });
    }

    // Role filter
    if (roleFilter !== "all") {
      result = result.filter((user) => user.role === roleFilter);
    }

    // Location filter
    if (locationFilter.trim()) {
      const location = locationFilter.toLowerCase();
      result = result.filter((user) => {
        const city = user.city?.toLowerCase() || "";
        const province = user.province?.toLowerCase() || "";
        return city.includes(location) || province.includes(location);
      });
    }

    setFilteredUsers(result);
  }, [searchQuery, roleFilter, locationFilter, users]);

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-200 via-white to-blue-200 pb-12">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Browse Users
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Discover taskers and connect with professionals
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <FiSearch className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                placeholder="Search by name, expertise, or skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-300 py-3 pl-12 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 sm:w-auto"
            >
              <FiFilter className="h-5 w-5" />
              Filters
            </button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Role
                  </label>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="all">All Roles</option>
                    <option value="tasker">Taskers</option>
                    <option value="customer">Customers</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Location
                  </label>
                  <input
                    type="text"
                    placeholder="City or Province"
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => {
                      setRoleFilter("all");
                      setLocationFilter("");
                      setSearchQuery("");
                    }}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Results Count */}
          <div className="text-sm text-gray-600">
            Showing <span className="font-semibold">{filteredUsers.length}</span> of{" "}
            <span className="font-semibold">{users.length}</span> users
          </div>
        </div>

        {/* Users Grid */}
        {loading ? (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-xl border border-gray-200 bg-white p-6"
              >
                <div className="mx-auto h-20 w-20 rounded-full bg-gray-200" />
                <div className="mt-4 h-4 rounded bg-gray-200" />
                <div className="mt-2 h-3 rounded bg-gray-200" />
              </div>
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="mt-12 text-center">
            <FiUser className="mx-auto h-16 w-16 text-gray-300" />
            <h3 className="mt-4 text-lg font-semibold text-gray-900">
              No users found
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredUsers.map((user) => {
              const fullName = `${user.firstName} ${user.middleName || ""} ${user.lastName}`.trim();
              const initials = getInitials(user.firstName, user.lastName);
              const location = [user.city, user.province].filter(Boolean).join(", ");

              return (
                <div
                  key={user.userId}
                  onClick={() => navigate(`/users/${user.userId}`)}
                  className="group cursor-pointer rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-blue-300 hover:shadow-md"
                >
                  {/* Avatar */}
                  <div className="flex justify-center">
                    <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-gray-200 bg-gray-100 transition group-hover:border-blue-400">
                      {user.profilePictureUrl ? (
                        <img
                          src={user.profilePictureUrl}
                          alt={fullName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-xl font-semibold text-blue-600">
                          {initials}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="mt-4 text-center">
                    <h3 className="text-base font-semibold text-gray-900 line-clamp-1 inline-flex items-center justify-center gap-1.5">
                      <span>{fullName}</span>
                      {user.isLegit && (
                        <span
                          className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-600 text-white shrink-0"
                          title="Verified User"
                        >
                          <FiCheckCircle className="w-3 h-3" />
                        </span>
                      )}
                    </h3>
                    <p className="mt-1 text-xs font-medium uppercase tracking-wide text-blue-600">
                      {user.role}
                    </p>
                    {user.expertise && (
                      <p className="mt-1 text-sm text-gray-600 line-clamp-1">
                        {user.expertise}
                      </p>
                    )}
                    {location && (
                      <p className="mt-1 text-xs text-gray-500 line-clamp-1">
                        📍 {location}
                      </p>
                    )}
                  </div>

                  {/* Rating */}
                  {user.role === "tasker" && user.rating !== undefined && (
                    <div className="mt-3 flex items-center justify-center gap-1 text-sm">
                      <FiStar className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold text-gray-900">
                        {user.rating.toFixed(1)}
                      </span>
                    </div>
                  )}

                  {/* Skills - Only for Taskers */}
                  {user.role === "tasker" && user.skills && user.skills.length > 0 && (
                    <div className="mt-3 flex flex-wrap justify-center gap-1">
                      {user.skills.slice(0, 3).map((skill, idx) => (
                        <span
                          key={idx}
                          className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700"
                        >
                          {skill}
                        </span>
                      ))}
                      {user.skills.length > 3 && (
                        <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                          +{user.skills.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Connect Button */}
                  {currentUser?.userId && user.userId !== currentUser.userId && (
                    <div className="mt-4">
                      {(() => {
                        const status = connectionStatuses[user.userId]?.status || "none";
                        if (status === "accepted") {
                          return (
                            <button
                              onClick={(e) => e.stopPropagation()}
                              className="w-full flex items-center justify-center gap-2 rounded-lg border border-green-300 bg-green-50 px-4 py-2 text-sm font-medium text-green-700"
                              disabled
                            >
                              <FiUserCheck />
                              Connected
                            </button>
                          );
                        } else if (status === "pending") {
                          const isRequester = connectionStatuses[user.userId]?.isRequester;
                          if (isRequester) {
                            return (
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (!confirm("Are you sure you want to cancel this connection request?")) {
                                    return;
                                  }
                                  try {
                                    const connId = connectionStatuses[user.userId]?.connection?.connectionId;
                                    if (connId) {
                                      const response = await removeConnection(connId);
                                      if (response?.status === 200 || response?.response) {
                                        await loadConnectionStatuses();
                                        alert("Connection request cancelled");
                                      } else {
                                        alert(response?.message || "Failed to cancel connection request");
                                      }
                                    }
                                  } catch (error: any) {
                                    console.error("Cancel connection error:", error);
                                    alert(error?.response?.data?.message || error?.message || "Failed to cancel connection request");
                                  }
                                }}
                                className="w-full flex items-center justify-center gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 transition"
                              >
                                <FiX />
                                Cancel Request
                              </button>
                            );
                          } else {
                            return (
                              <div className="flex gap-2">
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    try {
                                      const connId = connectionStatuses[user.userId]?.connection?.connectionId;
                                      if (connId) {
                                        const response = await acceptConnection(connId);
                                        if (response?.status === 200 || response?.response) {
                                          await loadConnectionStatuses();
                                          alert("Connection accepted!");
                                        } else {
                                          alert(response?.message || "Failed to accept connection");
                                        }
                                      }
                                    } catch (error: any) {
                                      console.error("Accept error:", error);
                                      alert(error?.response?.data?.message || error?.message || "Failed to accept connection");
                                    }
                                  }}
                                  className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                                >
                                  <FiUserCheck />
                                  Accept
                                </button>
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    try {
                                      const connId = connectionStatuses[user.userId]?.connection?.connectionId;
                                      if (connId) {
                                        const response = await rejectConnection(connId);
                                        if (response?.status === 200 || response?.response) {
                                          await loadConnectionStatuses();
                                        } else {
                                          alert(response?.message || "Failed to reject connection");
                                        }
                                      }
                                    } catch (error: any) {
                                      console.error("Reject error:", error);
                                      alert(error?.response?.data?.message || error?.message || "Failed to reject connection");
                                    }
                                  }}
                                  className="flex items-center justify-center rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                  <FiX />
                                </button>
                              </div>
                            );
                          }
                        } else {
                          return (
                            <button
                              onClick={(e) => handleConnect(user.userId, e)}
                              disabled={connecting === user.userId}
                              className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition disabled:opacity-50"
                            >
                              <FiUserPlus />
                              {connecting === user.userId ? "Connecting..." : "Connect"}
                            </button>
                          );
                        }
                      })()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default BrowseUsers;

