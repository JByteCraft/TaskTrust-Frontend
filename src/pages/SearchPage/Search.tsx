import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { FiUser, FiBriefcase, FiFileText, FiSearch } from "react-icons/fi";
import { GET } from "../../lib/utils/fetch.utils";
import { getStoredAuthToken } from "../../lib/utils/auth.utils";
import { getJobs } from "../../lib/api/jobs.api";

const Search = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    users: any[];
    jobs: any[];
    posts: any[];
  }>({
    users: [],
    jobs: [],
    posts: [],
  });

  useEffect(() => {
    const performSearch = async () => {
      if (!query.trim()) {
        setResults({ users: [], jobs: [], posts: [] });
        return;
      }

      setLoading(true);
      const token = getStoredAuthToken();
      if (!token) return;

      try {
        // Search users
        const usersResponse = await GET<any>(`/users?search=${encodeURIComponent(query)}`, "", token);
        const usersData = usersResponse?.response || usersResponse?.data?.response || usersResponse?.data || [];
        const users = Array.isArray(usersData) ? usersData : [];

        // Search jobs
        const jobsResponse = await getJobs();
        const jobsData = jobsResponse?.data?.response || jobsResponse?.data?.data || jobsResponse?.data || [];
        const allJobs = Array.isArray(jobsData) ? jobsData : [];
        const filteredJobs = allJobs.filter((job: any) => {
          const searchLower = query.toLowerCase();
          return (
            job.title?.toLowerCase().includes(searchLower) ||
            job.description?.toLowerCase().includes(searchLower) ||
            job.city?.toLowerCase().includes(searchLower) ||
            job.province?.toLowerCase().includes(searchLower) ||
            job.requiredSkills?.some((skill: string) => skill.toLowerCase().includes(searchLower))
          );
        });

        // Search posts
        const postsResponse = await GET<any>(`/posts?search=${encodeURIComponent(query)}`, "", token);
        const postsData = postsResponse?.response || postsResponse?.data?.response || postsResponse?.data || [];
        const posts = Array.isArray(postsData) ? postsData : [];

        setResults({
          users: users.slice(0, 10),
          jobs: filteredJobs.slice(0, 10),
          posts: posts.slice(0, 10),
        });
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [query]);

  if (!query.trim()) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-200 via-white to-blue-200 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <FiSearch className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Search TaskTrust</h2>
            <p className="text-gray-600">Enter a search query to find users, jobs, and posts</p>
          </div>
        </div>
      </div>
    );
  }

  const totalResults = results.users.length + results.jobs.length + results.posts.length;

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-200 via-white to-blue-200 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Search Results for &quot;{query}&quot;
          </h1>
          {!loading && (
            <p className="text-gray-600">
              Found {totalResults} result{totalResults !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-lg">Searching...</div>
          </div>
        ) : totalResults === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <FiSearch className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">No results found</h2>
            <p className="text-gray-600">Try a different search query</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Users Results */}
            {results.users.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FiUser className="h-5 w-5 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Users ({results.users.length})</h2>
                </div>
                <div className="space-y-3">
                  {results.users.map((user: any) => (
                    <Link
                      key={user.userId || user.id}
                      to={`/users/${user.userId || user.id}`}
                      className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                    >
                      <div className="flex items-center gap-3">
                        {user.profilePictureUrl && (
                          <img
                            src={user.profilePictureUrl}
                            alt={user.firstName}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        )}
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {user.firstName} {user.lastName}
                          </h3>
                          <p className="text-sm text-gray-600">{user.expertise || user.profession}</p>
                          {user.skills && user.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {user.skills.slice(0, 3).map((skill: string, idx: number) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Jobs Results */}
            {results.jobs.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FiBriefcase className="h-5 w-5 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Jobs ({results.jobs.length})</h2>
                </div>
                <div className="space-y-3">
                  {results.jobs.map((job: any) => (
                    <Link
                      key={job.jobId}
                      to={`/jobs/${job.jobId}`}
                      className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                    >
                      <h3 className="font-semibold text-gray-900 mb-1">{job.title}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">{job.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>₱{job.budget?.toLocaleString()}</span>
                        {(job.city || job.province) && (
                          <span>
                            {job.city && job.province ? `${job.city}, ${job.province}` : job.city || job.province}
                          </span>
                        )}
                        {job.matchPercentage !== undefined && (
                          <span className="text-blue-600 font-medium">{job.matchPercentage}% Match</span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Posts Results */}
            {results.posts.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FiFileText className="h-5 w-5 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Posts ({results.posts.length})</h2>
                </div>
                <div className="space-y-3">
                  {results.posts.map((post: any) => (
                    <div
                      key={post.postId || post._id}
                      className="p-4 border border-gray-200 rounded-lg"
                    >
                      <p className="text-gray-700 line-clamp-3">{post.content}</p>
                      {post.author && (
                        <div className="mt-2 text-sm text-gray-500">
                          by {post.author.firstName} {post.author.lastName}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;

