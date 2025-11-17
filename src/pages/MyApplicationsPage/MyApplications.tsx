import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FiEye, FiX, FiCheckCircle, FiClock, FiDollarSign } from "react-icons/fi";
import { getMyApplications, deleteApplication } from "../../lib/api/applications.api";
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
  const otherApps = applications.filter(
    (app) => !["pending", "accepted", "rejected"].includes(app.status)
  );

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-200 via-white to-blue-200 py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">My Applications</h1>
          <p className="text-sm sm:text-base text-gray-600">Track your job applications</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-2xl font-bold text-gray-900">{applications.length}</div>
            <div className="text-sm text-gray-600">Total Applications</div>
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
        </div>

        {/* Applications List */}
        {applications.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 sm:p-12 text-center">
            <p className="text-gray-500 text-base sm:text-lg mb-4">You haven't applied to any jobs yet</p>
            <Link
              to="/jobs"
              className="inline-block bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium hover:bg-blue-700 transition text-sm sm:text-base"
            >
              Browse Jobs
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => {
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
                            <FiDollarSign />
                            <span className="font-semibold text-gray-900">
                              ₱{job.budget.toLocaleString()}
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
                    <Link
                      to={`/jobs/${app.jobId}`}
                      className="flex items-center gap-2 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm"
                    >
                      <FiEye />
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
    </div>
  );
};

export default MyApplications;

