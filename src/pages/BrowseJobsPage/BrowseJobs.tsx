import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FiSearch, FiFilter, FiMapPin, FiDollarSign, FiClock, FiBriefcase, FiFileText } from "react-icons/fi";
import { getJobs, getMyJobs } from "../../lib/api/jobs.api";
import { getMyApplications, getApplications } from "../../lib/api/applications.api";
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
  const [myJobs, setMyJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [employedJobs, setEmployedJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMyJobs, setLoadingMyJobs] = useState(false);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("open");
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<"browse" | "my-jobs" | "applications" | "employed">("browse");

  const user = getAuthenticatedUserFromToken<{ role: string; userId?: number }>();
  const isCustomer = user?.role === "customer" || user?.role === "admin";
  const isTasker = user?.role === "tasker";

  const loadMyJobs = async () => {
    const token = getStoredAuthToken();
    if (!token) return;

    try {
      setLoadingMyJobs(true);
      const response = await getMyJobs();
      let jobsData: any[] = [];
      if (response?.data?.response && Array.isArray(response.data.response)) {
        jobsData = response.data.response;
      } else if (Array.isArray(response?.data)) {
        jobsData = response.data;
      }
      setMyJobs(Array.isArray(jobsData) ? jobsData : []);
    } catch (error) {
      console.error("Load my jobs error:", error);
    } finally {
      setLoadingMyJobs(false);
    }
  };

  const loadApplications = async () => {
    const token = getStoredAuthToken();
    if (!token) return;

    try {
      setLoadingApplications(true);
      const response = await getMyApplications();
      let appsData: any[] = [];
      if (response?.data?.response && Array.isArray(response.data.response)) {
        appsData = response.data.response;
      } else if (Array.isArray(response?.data)) {
        appsData = response.data;
      }
      setApplications(Array.isArray(appsData) ? appsData : []);
    } catch (error) {
      console.error("Load applications error:", error);
    } finally {
      setLoadingApplications(false);
    }
  };

  const loadEmployedJobs = async () => {
    const token = getStoredAuthToken();
    if (!token) return;

    try {
      // Get accepted applications
      const appsResponse = await getMyApplications();
      let appsData: any[] = [];
      if (appsResponse?.data?.response && Array.isArray(appsResponse.data.response)) {
        appsData = appsResponse.data.response;
      } else if (Array.isArray(appsResponse?.data)) {
        appsData = appsResponse.data;
      }
      
      const acceptedApps = appsData.filter((app: any) => app.status === "accepted");
      
      // Get job details for each accepted application
      const { getJob } = await import("../../lib/api/jobs.api");
      const jobsList: Job[] = [];
      for (const app of acceptedApps) {
        try {
          const jobResponse = await getJob(app.jobId);
          let jobData: any = null;
          if (jobResponse?.data?.response) {
            jobData = jobResponse.data.response;
          } else if (jobResponse?.data?.data) {
            jobData = jobResponse.data.data;
          } else if (jobResponse?.data?.jobId) {
            jobData = jobResponse.data;
          }
          
          if (jobData) {
            jobsList.push({
              jobId: jobData.jobId,
              title: jobData.title,
              description: jobData.description || "",
              budget: jobData.budget,
              city: jobData.city,
              province: jobData.province,
              requiredSkills: jobData.requiredSkills,
              status: jobData.status,
              applicationsCount: jobData.applicationsCount || 0,
              deadline: jobData.deadline,
              jobType: jobData.jobType,
              estimatedHours: jobData.estimatedHours,
              customerId: jobData.customerId,
              createdAt: jobData.createdAt,
            });
          }
        } catch (err) {
          console.error(`Failed to fetch job ${app.jobId}:`, err);
        }
      }
      
      setEmployedJobs(jobsList);
    } catch (error) {
      console.error("Load employed jobs error:", error);
    }
  };

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
    
    // Load customer's jobs if customer
    if (isCustomer) {
      loadMyJobs();
    }
    
    // Load tasker's applications and employed jobs if tasker
    if (isTasker) {
      loadApplications();
      loadEmployedJobs();
    }
  }, [navigate, isCustomer, isTasker]);

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

  // Get jobs to display based on active tab
  const getDisplayJobs = (): Job[] => {
    if (activeTab === "my-jobs") return myJobs;
    if (activeTab === "employed") return employedJobs;
    if (activeTab === "applications") {
      // For applications tab, show jobs from applications
      const jobIds = applications.map((app) => app.jobId);
      return jobs.filter((job) => jobIds.includes(job.jobId));
    }
    return jobs;
  };

  const displayJobs = getDisplayJobs();
  const filteredDisplayJobs = displayJobs.filter((job) => {
    if (searchQuery) {
      const matchesSearch = 
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.description.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
    }
    if (statusFilter && statusFilter !== "all") {
      if (job.status !== statusFilter) return false;
    }
    return true;
  });

  // Sort by match percentage for taskers in browse tab
  if (activeTab === "browse" && isTasker) {
    filteredDisplayJobs.sort((a, b) => {
      const matchA = a.matchPercentage || 0;
      const matchB = b.matchPercentage || 0;
      return matchB - matchA;
    });
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-200 via-white to-blue-200 py-8">
      <div className="w-full max-w-full sm:max-w-none mx-auto px-4 sm:px-6 lg:px-12 xl:px-16">
        {/* Header */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Jobs</h1>
            <p className="text-sm sm:text-base text-gray-600">
              {activeTab === "browse" && "Find the perfect job for your skills"}
              {activeTab === "my-jobs" && "Manage your posted jobs"}
              {activeTab === "applications" && "Track your job applications"}
              {activeTab === "employed" && "Jobs you're currently working on"}
            </p>
          </div>
          {isCustomer && activeTab === "browse" && (
            <Link
              to="/jobs/create"
              className="w-full sm:w-auto bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium hover:bg-blue-700 transition text-center text-sm sm:text-base"
            >
              + Create Job
            </Link>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="flex border-b border-gray-200 overflow-x-auto">
            <button
              onClick={() => setActiveTab("browse")}
              className={`flex-1 px-6 py-4 font-medium text-center transition whitespace-nowrap ${
                activeTab === "browse"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Browse Jobs
            </button>
            {isTasker && (
              <>
                <button
                  onClick={() => setActiveTab("applications")}
                  className={`flex-1 px-6 py-4 font-medium text-center transition whitespace-nowrap ${
                    activeTab === "applications"
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <FiFileText />
                    My Applications ({applications.length})
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab("employed")}
                  className={`flex-1 px-6 py-4 font-medium text-center transition whitespace-nowrap ${
                    activeTab === "employed"
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <FiBriefcase />
                    Employed ({employedJobs.length})
                  </div>
                </button>
              </>
            )}
            {isCustomer && (
              <button
                onClick={() => setActiveTab("my-jobs")}
                className={`flex-1 px-6 py-4 font-medium text-center transition whitespace-nowrap ${
                  activeTab === "my-jobs"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <FiBriefcase />
                  My Jobs ({myJobs.length})
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Search and Filters - Only show for browse tab */}
        {activeTab === "browse" && (
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
        )}

        {/* Applications Tab Content */}
        {activeTab === "applications" && (
          <div className="mb-6">
            {loadingApplications ? (
              <div className="text-center py-8">Loading applications...</div>
            ) : applications.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <p className="text-gray-500">You haven't applied to any jobs yet</p>
                <Link
                  to="/jobs"
                  className="inline-block mt-4 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab("browse");
                  }}
                >
                  Browse Jobs
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map((app) => {
                  const job = jobs.find((j) => j.jobId === app.jobId);
                  if (!job) return null;
                  return (
                    <Link
                      key={app.applicationId}
                      to={`/jobs/${job.jobId}`}
                      className="block bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{job.title}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                            <span className="font-semibold text-gray-900">₱{job.budget.toLocaleString()}</span>
                            <span className={`px-2 py-1 text-xs font-medium rounded ${
                              app.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                              app.status === "accepted" ? "bg-green-100 text-green-800" :
                              app.status === "rejected" ? "bg-red-100 text-red-800" :
                              "bg-gray-100 text-gray-800"
                            }`}>
                              {app.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Jobs Grid */}
        {activeTab !== "applications" && (
          <>
            {(loading || (activeTab === "my-jobs" && loadingMyJobs)) ? (
              <div className="text-center py-8">Loading...</div>
            ) : filteredDisplayJobs.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-8 sm:p-12 text-center">
                <p className="text-gray-500 text-base sm:text-lg">
                  {activeTab === "browse" && "No jobs found"}
                  {activeTab === "my-jobs" && "You haven't posted any jobs yet"}
                  {activeTab === "employed" && "You are not currently employed in any jobs"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {filteredDisplayJobs.map((job) => (
              <Link
                key={job.jobId}
                to={`/jobs/${job.jobId}`}
                className="bg-white rounded-lg shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-3 gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 line-clamp-2 flex-1">
                        {job.title}
                      </h3>
                      {isCustomer && job.customerId === user?.userId && (
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded shrink-0">
                          My Job
                        </span>
                      )}
                    </div>
                  </div>
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
                {activeTab === "my-jobs" && isCustomer && (
                  <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
                    {job.status === "open" && (
                      <>
                        <Link
                          to={`/jobs/${job.jobId}/edit`}
                          className="flex-1 text-center px-3 py-2 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition text-sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Edit
                        </Link>
                        <button
                          onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (confirm("Are you sure you want to cancel this job?")) {
                              try {
                                const { updateJob } = await import("../../lib/api/jobs.api");
                                await updateJob(job.jobId, { status: "cancelled" });
                                await loadMyJobs();
                                alert("Job cancelled successfully");
                              } catch (error: any) {
                                alert(error.response?.data?.message || "Failed to cancel job");
                              }
                            }
                          }}
                          className="flex-1 px-3 py-2 border border-orange-300 text-orange-600 rounded-lg hover:bg-orange-50 transition text-sm"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                    <Link
                      to={`/jobs/${job.jobId}`}
                      className="flex-1 text-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View
                    </Link>
                  </div>
                )}
              </Link>
            ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BrowseJobs;

