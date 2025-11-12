import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FiSearch, FiFilter, FiMapPin, FiDollarSign, FiClock } from "react-icons/fi";
import { getJobs } from "../../lib/api/jobs.api";
import { getStoredAuthToken } from "../../lib/utils/auth.utils";

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
};

const BrowseJobs = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("open");
  const [showFilters, setShowFilters] = useState(false);

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
        const jobsData = response?.data?.data || response?.data || [];
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

    setFilteredJobs(filtered);
  }, [searchQuery, statusFilter, jobs]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading jobs...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse Jobs</h1>
            <p className="text-gray-600">Find the perfect job for your skills</p>
          </div>
          <Link
            to="/jobs/create"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            + Create Job
          </Link>
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
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-500 text-lg">No jobs found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map((job) => (
              <Link
                key={job.jobId}
                to={`/jobs/${job.jobId}`}
                className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-semibold text-gray-900 line-clamp-2">
                    {job.title}
                  </h3>
                  <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                    {job.status}
                  </span>
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

