import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FiEye, FiX, FiCheckCircle, FiClock } from "react-icons/fi";
import { getMyApplications, deleteApplication, getApplications } from "../../lib/api/applications.api";
import { getJob } from "../../lib/api/jobs.api";
import { getStoredAuthToken, getAuthenticatedUserFromToken } from "../../lib/utils/auth.utils";

type Application = {
  applicationId: number;
  jobId: number;
  taskerId: number;
  coverLetter?: string;
  proposedBudget?: number;
  status: string;
  matchPercentage?: number;
  createdAt: string;
  updatedAt?: string;
};

type Job = {
  jobId: number;
  title: string;
  budget: number;
  status: string;
};

const MyApplications = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [jobs, setJobs] = useState<{ [key: number]: Job }>({});
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState<number | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "accepted" | "rejected" | "cancelled" | "employed">("all");
  const [employedJobs, setEmployedJobs] = useState<Job[]>([]);
  const [loadingEmployed, setLoadingEmployed] = useState(false);
  const [viewingApplication, setViewingApplication] = useState<Application | null>(null);
  const [viewingJob, setViewingJob] = useState<Job | null>(null);

  const user = getAuthenticatedUserFromToken<{ role: string }>();

  // Check if user is tasker
  if (user?.role !== "tasker" && user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-200 via-white to-blue-200">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">Only taskers can view their applications.</p>
          <Link to="/jobs" className="text-blue-600 hover:underline">
            Browse Jobs
          </Link>
        </div>
      </div>
    );
  }

  useEffect(() => {
    const fetchEmployedJobs = async () => {
      const token = getStoredAuthToken();
      if (!token) return;

      try {
        setLoadingEmployed(true);
        // Get accepted applications
        const appsResponse = await getMyApplications();
        let appsData: any[] = [];
        if (appsResponse?.data?.response && Array.isArray(appsResponse.data.response)) {
          appsData = appsResponse.data.response;
        } else if (Array.isArray(appsResponse?.data)) {
          appsData = appsResponse.data;
        }
        
        const acceptedApps = appsData.filter((app: Application) => app.status === "accepted");
        
        // Get job details for each accepted application
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
                budget: jobData.budget,
                status: jobData.status,
              });
            }
          } catch (err) {
            console.error(`Failed to fetch job ${app.jobId}:`, err);
          }
        }
        
        setEmployedJobs(jobsList);
      } catch (error) {
        console.error("Fetch employed jobs error:", error);
      } finally {
        setLoadingEmployed(false);
      }
    };

    fetchEmployedJobs();
  }, [navigate]);

  useEffect(() => {
    const fetchApplications = async () => {
      const token = getStoredAuthToken();
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        setLoading(true);
        const response = await getMyApplications();
        // Backend returns: { status: 200, response: [...], message: '...' }
        // axios returns: { data: { status, response, message } }
        const appsData = response?.data?.response || response?.data?.data || response?.data || [];
        const apps = Array.isArray(appsData) ? appsData : [];
        setApplications(apps);

        // Fetch job details for each application
        const jobsMap: { [key: number]: Job } = {};
        for (const app of apps) {
          try {
            const jobResponse = await getJob(app.jobId);
            // Backend returns: { status: 200, response: {...}, message: '...' }
            const jobData = jobResponse?.data?.response || jobResponse?.data?.data || jobResponse?.data;
            if (jobData) {
              jobsMap[app.jobId] = jobData;
            }
          } catch (err) {
            console.error(`Failed to fetch job ${app.jobId}:`, err);
          }
        }
        setJobs(jobsMap);
      } catch (error: any) {
        console.error("Fetch applications error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [navigate]);

  const handleWithdraw = async (applicationId: number) => {
    if (!confirm("Are you sure you want to withdraw this application?")) {
      return;
    }

    const token = getStoredAuthToken();
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setWithdrawing(applicationId);
      await deleteApplication(applicationId);
      setApplications(applications.filter((app) => app.applicationId !== applicationId));
      alert("Application withdrawn successfully");
    } catch (error: any) {
      console.error("Withdraw error:", error);
      alert(error.response?.data?.message || "Failed to withdraw application");
    } finally {
      setWithdrawing(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "accepted":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "withdrawn":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <FiClock className="text-yellow-600" />;
      case "accepted":
        return <FiCheckCircle className="text-green-600" />;
      case "rejected":
        return <FiX className="text-red-600" />;
      default:
        return <FiClock className="text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading your applications...</div>
      </div>
    );
  }

  // Group applications by status
  const pendingApps = applications.filter((app) => app.status === "pending");
  const acceptedApps = applications.filter((app) => app.status === "accepted");
  const rejectedApps = applications.filter((app) => app.status === "rejected");
  const cancelledApps = applications.filter((app) => app.status === "cancelled" || app.status === "withdrawn");
  const otherApps = applications.filter(
    (app) => !["pending", "accepted", "rejected", "cancelled", "withdrawn"].includes(app.status)
  );

  // Filter applications based on selected filter
  const filteredApplications = applications.filter((app) => {
    if (filter === "all") return true;
    if (filter === "pending") return app.status === "pending";
    if (filter === "accepted") return app.status === "accepted";
    if (filter === "rejected") return app.status === "rejected";
    if (filter === "cancelled") return app.status === "cancelled" || app.status === "withdrawn";
    if (filter === "employed") return false; // Employed jobs shown separately
    return true;
  });

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-200 via-white to-blue-200 py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">My Applications</h1>
          <p className="text-sm sm:text-base text-gray-600">Track your job applications</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-2xl font-bold text-gray-900">{applications.length}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-2xl font-bold text-yellow-600">{pendingApps.length}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-2xl font-bold text-green-600">{acceptedApps.length}</div>
            <div className="text-sm text-gray-600">Accepted</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-2xl font-bold text-red-600">{rejectedApps.length}</div>
            <div className="text-sm text-gray-600">Rejected</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-2xl font-bold text-gray-600">{cancelledApps.length}</div>
            <div className="text-sm text-gray-600">Cancelled</div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === "all"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
            }`}
          >
            All ({applications.length})
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === "pending"
                ? "bg-yellow-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
            }`}
          >
            Pending ({pendingApps.length})
          </button>
          <button
            onClick={() => setFilter("accepted")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === "accepted"
                ? "bg-green-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
            }`}
          >
            Accepted ({acceptedApps.length})
          </button>
          <button
            onClick={() => setFilter("rejected")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === "rejected"
                ? "bg-red-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
            }`}
          >
            Rejected ({rejectedApps.length})
          </button>
          <button
            onClick={() => setFilter("cancelled")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === "cancelled"
                ? "bg-gray-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
            }`}
          >
            Cancelled ({cancelledApps.length})
          </button>
          <button
            onClick={() => setFilter("employed")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === "employed"
                ? "bg-purple-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
            }`}
          >
            Employed ({employedJobs.length})
          </button>
        </div>

        {/* Employed Jobs List */}
        {filter === "employed" && (
          <>
            {loadingEmployed ? (
              <div className="text-center py-8">Loading employed jobs...</div>
            ) : employedJobs.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <p className="text-gray-500">You are not currently employed in any jobs</p>
              </div>
            ) : (
              <div className="space-y-4">
                {employedJobs.map((job) => (
                  <div
                    key={job.jobId}
                    className="bg-white rounded-lg shadow-sm p-4 sm:p-6 hover:shadow-md transition"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(job.status)}`}>
                            {job.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="font-semibold text-gray-900">₱{job.budget.toLocaleString()}</span>
                        </div>
                      </div>
                      <Link
                        to={`/jobs/${job.jobId}`}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm"
                      >
                        <FiEye />
                        View Job
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Applications List */}
        {filter !== "employed" && filteredApplications.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 sm:p-12 text-center">
            <p className="text-gray-500 text-base sm:text-lg mb-4">
              {applications.length === 0
                ? "You haven't applied to any jobs yet"
                : `No ${filter === "all" ? "" : filter} applications found`}
            </p>
            <Link
              to="/jobs"
              className="inline-block bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium hover:bg-blue-700 transition text-sm sm:text-base"
            >
              Browse Jobs
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredApplications.map((app) => {
              const job = jobs[app.jobId];
              return (
                <div
                  key={app.applicationId}
                  className="bg-white rounded-lg shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-3">
                    <div className="flex-1 w-full">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                          {job?.title || `Job #${app.jobId}`}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(
                            app.status
                          )}`}
                        >
                          {getStatusIcon(app.status)}
                          {app.status.toUpperCase()}
                        </span>
                        {app.matchPercentage !== undefined && app.matchPercentage !== null && (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {app.matchPercentage}% Match
                          </span>
                        )}
                      </div>
                      {job && (
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-semibold text-gray-700">₱</span>
                            <span className="font-semibold text-gray-900">
                              {job.budget.toLocaleString()}
                            </span>
                          </div>
                          {app.proposedBudget && (
                            <div className="text-gray-500">
                              Your proposal: ₱{app.proposedBudget.toLocaleString()}
                            </div>
                          )}
                        </div>
                      )}
                      {app.coverLetter && (
                        <p className="text-gray-600 text-sm line-clamp-2 mt-2">
                          {app.coverLetter}
                        </p>
                      )}
                      <div className="text-xs text-gray-500 mt-2">
                        Applied on {new Date(app.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 sm:gap-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => {
                        setViewingApplication(app);
                        setViewingJob(job || null);
                      }}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold text-sm shadow-sm"
                    >
                      <FiEye className="w-4 h-4" />
                      View Application
                    </button>
                    <Link
                      to={`/jobs/${app.jobId}`}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm"
                    >
                      <FiEye className="w-4 h-4" />
                      View Job
                    </Link>
                    {app.status === "pending" && (
                      <button
                        onClick={() => handleWithdraw(app.applicationId)}
                        disabled={withdrawing === app.applicationId}
                        className="flex items-center gap-2 px-3 sm:px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition disabled:opacity-50 text-sm"
                      >
                        <FiX />
                        {withdrawing === app.applicationId ? "Withdrawing..." : "Withdraw"}
                      </button>
                    )}
                    {app.status === "accepted" && (
                      <span className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm">
                        <FiCheckCircle />
                        Application Accepted!
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* View Application Modal */}
      {viewingApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Application Details</h2>
                <button
                  onClick={() => {
                    setViewingApplication(null);
                    setViewingJob(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              {viewingJob && (
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{viewingJob.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold text-gray-700">₱</span>
                      <span className="font-semibold text-gray-900">
                        {viewingJob.budget.toLocaleString()}
                      </span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(viewingJob.status)}`}>
                      {viewingJob.status}
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Application Status</label>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${getStatusColor(viewingApplication.status)}`}>
                      {getStatusIcon(viewingApplication.status)}
                      {viewingApplication.status.toUpperCase()}
                    </span>
                    {viewingApplication.matchPercentage !== undefined && viewingApplication.matchPercentage !== null && (
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        {viewingApplication.matchPercentage}% Match
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Application ID</label>
                  <p className="text-gray-900">#{viewingApplication.applicationId}</p>
                </div>

                {viewingApplication.coverLetter && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cover Letter</label>
                    <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">
                      {viewingApplication.coverLetter}
                    </p>
                  </div>
                )}

                {viewingApplication.proposedBudget && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Proposed Budget</label>
                    <p className="text-gray-900">
                      <span className="text-lg font-semibold text-gray-700">₱</span>
                      <span className="font-semibold text-gray-900">
                        {viewingApplication.proposedBudget.toLocaleString()}
                      </span>
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Applied On</label>
                  <p className="text-gray-900">
                    {new Date(viewingApplication.createdAt).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>

                {viewingApplication.status?.toLowerCase() === "accepted" && viewingApplication.updatedAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hired On</label>
                    <p className="text-gray-900">
                      {new Date(viewingApplication.updatedAt).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                )}

                {viewingApplication.status?.toLowerCase() === "rejected" && viewingApplication.updatedAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rejected On</label>
                    <p className="text-gray-900">
                      {new Date(viewingApplication.updatedAt).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200 flex gap-3">
                <Link
                  to={`/jobs/${viewingApplication.jobId}`}
                  className="flex-1 text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  View Job
                </Link>
                <button
                  onClick={() => {
                    setViewingApplication(null);
                    setViewingJob(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyApplications;

