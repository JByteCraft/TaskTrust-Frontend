import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch, FiFilter, FiUser, FiStar } from "react-icons/fi";
import { GET } from "../../lib/utils/fetch.utils";
import { getStoredAuthToken } from "../../lib/utils/auth.utils";

type UserCard = {
  userId: number;
  firstName: string;
  lastName: string;
  middleName?: string;
  role: string;
  profession?: string;
  profilePictureUrl?: string;
  rating?: number;
  skills?: string[];
  city?: string;
  province?: string;
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
        
        const usersData = response?.data || response?.users || response || [];
        setUsers(Array.isArray(usersData) ? usersData : []);
        setFilteredUsers(Array.isArray(usersData) ? usersData : []);
      } catch (err: any) {
        console.error("Fetch users error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [navigate]);

  useEffect(() => {
    let result = [...users];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((user) => {
        const fullName = `${user.firstName} ${user.middleName || ""} ${user.lastName}`.toLowerCase();
        const profession = user.profession?.toLowerCase() || "";
        const skills = user.skills?.join(" ").toLowerCase() || "";
        return fullName.includes(query) || profession.includes(query) || skills.includes(query);
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
    <div className="min-h-screen bg-slate-100 pb-12">
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
                placeholder="Search by name, profession, or skills..."
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
                    <h3 className="text-base font-semibold text-gray-900 line-clamp-1">
                      {fullName}
                    </h3>
                    <p className="mt-1 text-xs font-medium uppercase tracking-wide text-blue-600">
                      {user.role}
                    </p>
                    {user.profession && (
                      <p className="mt-1 text-sm text-gray-600 line-clamp-1">
                        {user.profession}
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

                  {/* Skills */}
                  {user.skills && user.skills.length > 0 && (
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

