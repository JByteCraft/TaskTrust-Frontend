import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FiEdit, FiTrash2, FiEye, FiUsers, FiDollarSign, FiMapPin, FiClock } from "react-icons/fi";
import { getMyJobs, deleteJob } from "../../lib/api/jobs.api";
import { getJobApplications } from "../../lib/api/applications.api";
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
};

const MyJobs = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [applicationCounts, setApplicationCounts] = useState<{ [key: number]: number }>({});

  const user = getAuthenticatedUserFromToken<{ role: string }>();

  // Check if user is customer
  if (user?.role !== "customer" && user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-200 via-white to-blue-200">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">Only customers can view their jobs.</p>
          <Link to="/jobs" className="text-blue-600 hover:underline">
            Browse Jobs
          </Link>
        </div>
      </div>
    );
  }

  useEffect(() => {
    const fetchJobs = async () => {
      const token = getStoredAuthToken();
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        setLoading(true);
        const response = await getMyJobs();
        console.log("MyJobs API Response:", response?.data);
        
        // Backend returns: { status: 200, response: jobs, message: '...' }
        let jobsData: any[] = [];
        if (response?.data) {
          if (response.data.response && Array.isArray(response.data.response)) {
            jobsData = response.data.response;
          } else if (response.data.data && Array.isArray(response.data.data)) {
            jobsData = response.data.data;
          } else if (Array.isArray(response.data)) {
            jobsData = response.data;
          }
        }
        
        console.log("MyJobs Extracted jobs:", jobsData);
        setJobs(Array.isArray(jobsData) ? jobsData : []);

        // Fetch application counts for each job
        const counts: { [key: number]: number } = {};
        for (const job of Array.isArray(jobsData) ? jobsData : []) {
          try {
            const appsResponse = await getJobApplications(job.jobId);
            // Backend returns: { status: 200, response: [...], message: '...' }
            const apps = appsResponse?.data?.response || appsResponse?.data?.data || appsResponse?.data || [];
            counts[job.jobId] = Array.isArray(apps) ? apps.length : 0;
          } catch (err) {
            counts[job.jobId] = 0;
          }
        }
        setApplicationCounts(counts);
      } catch (error: any) {
        console.error("Fetch jobs error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [navigate]);

  const handleDelete = async (jobId: number) => {
    if (!confirm("Are you sure you want to delete this job?")) {
      return;
    }

    const token = getStoredAuthToken();
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setDeleting(jobId);
      await deleteJob(jobId);
      setJobs(jobs.filter((job) => job.jobId !== jobId));
      alert("Job deleted successfully");
    } catch (error: any) {
      console.error("Delete error:", error);
      alert(error.response?.data?.message || "Failed to delete job");
    } finally {
      setDeleting(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading your jobs...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-200 via-white to-blue-200 py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">My Jobs</h1>
            <p className="text-sm sm:text-base text-gray-600">Manage your posted jobs</p>
          </div>
          <Link
            to="/jobs/create"
            className="w-full sm:w-auto bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium hover:bg-blue-700 transition text-center text-sm sm:text-base"
          >
            + Create New Job
          </Link>
        </div>

        {/* Jobs List */}
        {jobs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 sm:p-12 text-center">
            <p className="text-gray-500 text-base sm:text-lg mb-4">You haven't posted any jobs yet</p>
            <Link
              to="/jobs/create"
              className="inline-block bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium hover:bg-blue-700 transition text-sm sm:text-base"
            >
              Create Your First Job
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <div
                key={job.jobId}
                className="bg-white rounded-lg shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-3">
                  <div className="flex-1 w-full">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900">{job.title}</h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          job.status
                        )}`}
                      >
                        {job.status.replace("_", " ").toUpperCase()}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                      {job.description}
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <FiDollarSign />
                        <span className="font-semibold text-gray-900">
                          ₱{job.budget.toLocaleString()}
                        </span>
                      </div>
                      {(job.city || job.province) && (
                        <div className="flex items-center gap-2">
                          <FiMapPin />
                          <span>
                            {job.city && job.province
                              ? `${job.city}, ${job.province}`
                              : job.city || job.province}
                          </span>
                        </div>
                      )}
                      {job.estimatedHours && (
                        <div className="flex items-center gap-2">
                          <FiClock />
                          <span>{job.estimatedHours} hours</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <FiUsers />
                        <span>
                          {applicationCounts[job.jobId] || job.applicationsCount || 0}{" "}
                          application{applicationCounts[job.jobId] !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Skills */}
                {job.requiredSkills && job.requiredSkills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {job.requiredSkills.slice(0, 5).map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                      >
                        {skill}
                      </span>
                    ))}
                    {job.requiredSkills.length > 5 && (
                      <span className="px-2 py-1 text-xs text-gray-500">
                        +{job.requiredSkills.length - 5} more
                      </span>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2 sm:gap-3 pt-4 border-t border-gray-200">
                  <Link
                    to={`/jobs/${job.jobId}`}
                    className="flex items-center gap-2 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm"
                  >
                    <FiEye />
                    View Details
                  </Link>
                  <Link
                    to={`/jobs/${job.jobId}/applications`}
                    className="flex items-center gap-2 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm"
                  >
                    <FiUsers />
                    Applications ({applicationCounts[job.jobId] || 0})
                  </Link>
                  {job.status === "open" && (
                    <>
                      <Link
                        to={`/jobs/${job.jobId}/edit`}
                        className="flex items-center gap-2 px-3 sm:px-4 py-2 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition text-sm"
                      >
                        <FiEdit />
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(job.jobId)}
                        disabled={deleting === job.jobId}
                        className="flex items-center gap-2 px-3 sm:px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition disabled:opacity-50 text-sm"
                      >
                        <FiTrash2 />
                        {deleting === job.jobId ? "Deleting..." : "Delete"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyJobs;

