import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FiSearch, FiFilter, FiMapPin, FiDollarSign, FiClock } from "react-icons/fi";
import { getJobs } from "../../lib/api/jobs.api";
import { getStoredAuthToken, getAuthenticatedUserFromToken } from "../../lib/utils/auth.utils";

type Job = {
  jobId: number;
  title: string;
  description: string;
  budget: number;
  city?: string;
  province?: string;
  requiredSkills?: string[];
  status: string;
  applicationsCount: number;
  deadline?: string;
  jobType?: string;
  estimatedHours?: number;
  customerId: number;
  createdAt: string;
  matchPercentage?: number; // Match percentage for taskers
};

const BrowseJobs = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("open");
  const [showFilters, setShowFilters] = useState(false);

  const user = getAuthenticatedUserFromToken<{ role: string }>();
  const isCustomer = user?.role === "customer" || user?.role === "admin";
  const isTasker = user?.role === "tasker";

  useEffect(() => {
    const fetchJobs = async () => {
      const token = getStoredAuthToken();
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        setLoading(true);
        const response = await getJobs({ status: "open" });
        console.log("Jobs API Response:", response?.data);
        
        // Backend returns: { status: 200, response: jobs, message: '...' }
        let jobsData: any[] = [];
        if (response?.data) {
          // Structure 1: { status: 200, response: [...], message: '...' }
          if (response.data.response && Array.isArray(response.data.response)) {
            jobsData = response.data.response;
          }
          // Structure 2: { data: [...] }
          else if (response.data.data && Array.isArray(response.data.data)) {
            jobsData = response.data.data;
          }
          // Structure 3: Array directly
          else if (Array.isArray(response.data)) {
            jobsData = response.data;
          }
        }
        
        console.log("Extracted jobs:", jobsData);
        setJobs(Array.isArray(jobsData) ? jobsData : []);
        setFilteredJobs(Array.isArray(jobsData) ? jobsData : []);
      } catch (err: any) {
        console.error("Fetch jobs error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [navigate]);

  useEffect(() => {
    let filtered = jobs;

    if (searchQuery) {
      filtered = filtered.filter(
        (job) =>
          job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          job.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter((job) => job.status === statusFilter);
    }

    // Sort by match percentage for taskers (highest first)
    if (isTasker) {
      filtered = filtered.sort((a, b) => {
        const matchA = a.matchPercentage || 0;
        const matchB = b.matchPercentage || 0;
        return matchB - matchA;
      });
    }

    setFilteredJobs(filtered);
  }, [searchQuery, statusFilter, jobs, isTasker]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading jobs...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-200 via-white to-blue-200 py-8">
      <div className="w-full max-w-full sm:max-w-none mx-auto px-4 sm:px-6 lg:px-12 xl:px-16">
        {/* Header */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Browse Jobs</h1>
            <p className="text-sm sm:text-base text-gray-600">Find the perfect job for your skills</p>
          </div>
          {isCustomer && (
            <Link
              to="/jobs/create"
              className="w-full sm:w-auto bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium hover:bg-blue-700 transition text-center text-sm sm:text-base"
            >
              + Create Job
            </Link>
          )}
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search jobs by title or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <FiFilter />
              Filters
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex flex-wrap gap-4">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                  aria-label="Filter jobs by status"
                  title="Filter jobs by status"
                >
                  <option value="all">All Status</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Jobs Grid */}
        {filteredJobs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 sm:p-12 text-center">
            <p className="text-gray-500 text-base sm:text-lg">No jobs found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredJobs.map((job) => (
              <Link
                key={job.jobId}
                to={`/jobs/${job.jobId}`}
                className="bg-white rounded-lg shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-3 gap-2">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 line-clamp-2 flex-1">
                    {job.title}
                  </h3>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {isTasker && job.matchPercentage !== undefined && (
                      <span className="px-2 py-1 text-xs font-bold bg-blue-600 text-white rounded">
                        {job.matchPercentage}% Match
                      </span>
                    )}
                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                      {job.status}
                    </span>
                  </div>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {job.description}
                </p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FiDollarSign />
                    <span className="font-semibold text-gray-900">
                      ₱{job.budget.toLocaleString()}
                    </span>
                  </div>
                  {(job.city || job.province) && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FiMapPin />
                      <span>
                        {job.city && job.province
                          ? `${job.city}, ${job.province}`
                          : job.city || job.province}
                      </span>
                    </div>
                  )}
                  {job.estimatedHours && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FiClock />
                      <span>{job.estimatedHours} hours</span>
                    </div>
                  )}
                </div>

                {job.requiredSkills && job.requiredSkills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {job.requiredSkills.slice(0, 3).map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                      >
                        {skill}
                      </span>
                    ))}
                    {job.requiredSkills.length > 3 && (
                      <span className="px-2 py-1 text-xs text-gray-500">
                        +{job.requiredSkills.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                <div className="text-xs text-gray-500">
                  {job.applicationsCount} application
                  {job.applicationsCount !== 1 ? "s" : ""}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BrowseJobs;

