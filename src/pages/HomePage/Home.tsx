import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FiBriefcase, FiUsers, FiFileText, FiArrowRight } from "react-icons/fi";
import { getJobs, getTaskerMatches } from "../../lib/api/jobs.api";
import { getPosts } from "../../lib/api/posts.api";
import { getStoredAuthToken, getAuthenticatedUserFromToken } from "../../lib/utils/auth.utils";

type Job = {
  jobId: number;
  title: string;
  budget: number;
  city?: string;
  province?: string;
  status: string;
};

type Post = {
  postId: number;
  content: string;
  likes: number;
  comments: number;
  createdAt: string;
};

const Home = () => {
  const navigate = useNavigate();
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [matchedJobs, setMatchedJobs] = useState<any[]>([]);
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const user = getAuthenticatedUserFromToken<{ role: string; userId: number }>();
  const isTasker = user?.role === "tasker";
  const isCustomer = user?.role === "customer";

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

      // Load recent jobs
      const jobsResponse = await getJobs({ status: "open" });
      console.log("Home Jobs API Response:", jobsResponse?.data);
      
      // Backend returns: { status: 200, response: jobs, message: '...' }
      let jobsData: any[] = [];
      if (jobsResponse?.data) {
        if (jobsResponse.data.response && Array.isArray(jobsResponse.data.response)) {
          jobsData = jobsResponse.data.response;
        } else if (jobsResponse.data.data && Array.isArray(jobsResponse.data.data)) {
          jobsData = jobsResponse.data.data;
        } else if (Array.isArray(jobsResponse.data)) {
          jobsData = jobsResponse.data;
        }
      }
      
      console.log("Home Extracted jobs:", jobsData);
      setRecentJobs(Array.isArray(jobsData) ? jobsData.slice(0, 5) : []);

      // Load matched jobs (if tasker)
      if (isTasker) {
        try {
          const matchesResponse = await getTaskerMatches();
          // Backend returns: { status: 200, response: [...], message: '...' }
          const matchesData = matchesResponse?.data?.response || matchesResponse?.data?.data || matchesResponse?.data || [];
          setMatchedJobs(
            Array.isArray(matchesData)
              ? matchesData.slice(0, 5).map((m: any) => m.job)
              : []
          );
        } catch (error) {
          console.error("Load matches error:", error);
        }
      }

      // Load recent posts
      try {
        const postsResponse = await getPosts({ limit: 5, visibility: "public" });
        const postsData = postsResponse?.data?.data?.posts || postsResponse?.data?.posts || postsResponse?.data || [];
        setRecentPosts(Array.isArray(postsData) ? postsData.slice(0, 5) : []);
      } catch (error) {
        console.error("Load posts error:", error);
      }
    } catch (error) {
      console.error("Load data error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-200 via-white to-blue-200 py-4 sm:py-8">
      <div className="w-full max-w-full sm:max-w-none mx-auto px-4 sm:px-6 lg:px-12 xl:px-16">
        {/* Welcome Section */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
            Welcome to TaskTrust
          </h1>
          <p className="text-gray-600 text-base sm:text-lg">
            {isTasker
              ? "Find jobs that match your skills"
              : isCustomer
              ? "Post jobs and find the perfect tasker"
              : "Connect, collaborate, and get things done"}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Link
            to="/jobs"
            className="bg-white rounded-lg shadow-sm p-4 sm:p-6 hover:shadow-md transition"
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                <FiBriefcase className="text-blue-600 text-xl sm:text-2xl" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Browse Jobs</h3>
                <p className="text-xs sm:text-sm text-gray-600">Find opportunities</p>
              </div>
            </div>
          </Link>
          <Link
            to="/feed"
            className="bg-white rounded-lg shadow-sm p-4 sm:p-6 hover:shadow-md transition"
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                <FiFileText className="text-green-600 text-xl sm:text-2xl" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base">View Feed</h3>
                <p className="text-xs sm:text-sm text-gray-600">See what's happening</p>
              </div>
            </div>
          </Link>
          <Link
            to="/connections"
            className="bg-white rounded-lg shadow-sm p-4 sm:p-6 hover:shadow-md transition sm:col-span-2 md:col-span-1"
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                <FiUsers className="text-purple-600 text-xl sm:text-2xl" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base">My Network</h3>
                <p className="text-xs sm:text-sm text-gray-600">Manage connections</p>
              </div>
            </div>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Matched Jobs (Taskers) */}
          {isTasker && matchedJobs.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                  Matched Jobs for You
                </h2>
                <Link
                  to="/jobs"
                  className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                >
                  View All <FiArrowRight />
                </Link>
              </div>
              <div className="space-y-3">
                {matchedJobs.map((job: any) => (
                  <Link
                    key={job.jobId}
                    to={`/jobs/${job.jobId}`}
                    className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition"
                  >
                    <div className="flex justify-between items-start mb-1 gap-2">
                      <h3 className="font-semibold text-gray-900 flex-1">
                        {job.title}
                      </h3>
                      {job.matchPercentage !== undefined && (
                        <span className="px-2 py-1 text-xs font-bold bg-blue-600 text-white rounded shrink-0">
                          {job.matchPercentage}% Match
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>₱{job.budget.toLocaleString()}</span>
                      {(job.city || job.province) && (
                        <span>
                          {job.city && job.province
                            ? `${job.city}, ${job.province}`
                            : job.city || job.province}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Recent Jobs */}
          {recentJobs.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                  Recent Jobs
                </h2>
                <Link
                  to="/jobs"
                  className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                >
                  View All <FiArrowRight />
                </Link>
              </div>
              <div className="space-y-3">
                {recentJobs.map((job) => (
                  <Link
                    key={job.jobId}
                    to={`/jobs/${job.jobId}`}
                    className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition"
                  >
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {job.title}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>₱{job.budget.toLocaleString()}</span>
                      {(job.city || job.province) && (
                        <span>
                          {job.city && job.province
                            ? `${job.city}, ${job.province}`
                            : job.city || job.province}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Recent Posts */}
          {recentPosts.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                  Recent Posts
                </h2>
                <Link
                  to="/feed"
                  className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                >
                  View All <FiArrowRight />
                </Link>
              </div>
              <div className="space-y-3">
                {recentPosts.map((post) => (
                  <Link
                    key={post.postId}
                    to="/feed"
                    className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition"
                  >
                    <p className="text-gray-900 line-clamp-2 mb-2">
                      {post.content}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>{post.likes} likes</span>
                      <span>{post.comments} comments</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Empty State */}
        {recentJobs.length === 0 && recentPosts.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-8 sm:p-12 text-center">
            <p className="text-gray-500 text-base sm:text-lg mb-4">
              No content yet. Get started by browsing jobs or creating a post!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Link
                to="/jobs"
                className="bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium hover:bg-blue-700 transition text-sm sm:text-base"
              >
                Browse Jobs
              </Link>
              <Link
                to="/feed"
                className="bg-green-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium hover:bg-green-700 transition text-sm sm:text-base"
              >
                View Feed
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
