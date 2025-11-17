import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { FiMapPin, FiDollarSign, FiClock, FiUser, FiCheckCircle } from "react-icons/fi";
import { getJob, getJobMatches, getMatchPercentage } from "../../lib/api/jobs.api";
import { createApplication, getJobApplications } from "../../lib/api/applications.api";
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

const JobDetails = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [applicationData, setApplicationData] = useState({
    coverLetter: "",
    proposedBudget: "",
  });
  const [matchPercentage, setMatchPercentage] = useState<number | null>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [showMatches, setShowMatches] = useState(false);
  const [matches, setMatches] = useState<any[]>([]);

  const user = getAuthenticatedUserFromToken<{ userId: number; role: string }>();
  const isTasker = user?.role === "tasker";
  const isCustomer = user?.role === "customer" || user?.role === "admin";
  const isOwner = job && user && job.customerId === user.userId;

  useEffect(() => {
    const fetchJob = async () => {
      const token = getStoredAuthToken();
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        setLoading(true);
        const response = await getJob(Number(jobId));
        
        // Extract job data from various response structures
        let jobData: any = null;
        if (response?.data) {
          if (response.data.response && typeof response.data.response === 'object') {
            jobData = response.data.response;
          } else if (response.data.data && typeof response.data.data === 'object') {
            jobData = response.data.data;
          } else if (typeof response.data === 'object' && response.data.jobId) {
            jobData = response.data;
          }
        }
        
        if (jobData && jobData.jobId) {
          setJob(jobData);
          
          // If tasker, get match percentage
          if (isTasker && user?.userId) {
            try {
              const matchResponse = await getMatchPercentage(
                Number(jobId),
                user.userId
              );
              // Backend returns: { status: 200, response: { matchPercentage }, message: '...' }
              const matchData = matchResponse?.data?.response || matchResponse?.data?.data || matchResponse?.data;
              setMatchPercentage(matchData?.matchPercentage || null);
            } catch (err) {
              console.error("Match calculation error:", err);
            }
          }

          // If owner, get applications
          const isOwner = jobData.customerId === user?.userId;
          if (isOwner) {
            try {
              const appsResponse = await getJobApplications(Number(jobId));
              // Backend returns: { status: 200, response: [...], message: '...' }
              const appsData = appsResponse?.data?.response || appsResponse?.data?.data || appsResponse?.data || [];
              setApplications(Array.isArray(appsData) ? appsData : []);
            } catch (err) {
              console.error("Fetch applications error:", err);
            }
          }
        } else {
          console.error("Job not found or invalid response:", response);
        }
      } catch (error: any) {
        console.error("Fetch job error:", error);
      } finally {
        setLoading(false);
      }
    };

    if (jobId) {
      fetchJob();
    }
  }, [jobId, navigate, isTasker, user?.userId]);

  const handleApply = async () => {
    if (!job || !user) return;

    const token = getStoredAuthToken();
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setApplying(true);
      const payload: any = {};
      if (applicationData.coverLetter) payload.coverLetter = applicationData.coverLetter;
      if (applicationData.proposedBudget) payload.proposedBudget = Number(applicationData.proposedBudget);

      await createApplication({ jobId: job.jobId, ...payload });
      alert("Application submitted successfully!");
      setShowApplicationForm(false);
      setApplicationData({ coverLetter: "", proposedBudget: "" });
    } catch (error: any) {
      console.error("Apply error:", error);
      alert(error.response?.data?.message || "Failed to submit application");
    } finally {
      setApplying(false);
    }
  };

  const handleViewMatches = async () => {
    if (!jobId) return;
    try {
      const response = await getJobMatches(Number(jobId));
      // Backend returns: { status: 200, response: [...], message: '...' }
      const matchesData = response?.data?.response || response?.data?.data || response?.data || [];
      setMatches(Array.isArray(matchesData) ? matchesData : []);
      setShowMatches(true);
    } catch (error) {
      console.error("Fetch matches error:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading job details...</div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Job Not Found</h2>
          <Link to="/jobs" className="text-blue-600 hover:underline">
            Back to Jobs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-200 via-white to-blue-200 py-4 sm:py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-3">
            <div className="flex-1 w-full">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-gray-600">
                <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${
                  job.status === "open" ? "bg-green-100 text-green-800" :
                  job.status === "in_progress" ? "bg-blue-100 text-blue-800" :
                  job.status === "completed" ? "bg-gray-100 text-gray-800" :
                  "bg-red-100 text-red-800"
                }`}>
                  {job.status.replace("_", " ").toUpperCase()}
                </span>
                {matchPercentage !== null && (
                  <span className="px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {matchPercentage}% Match
                  </span>
                )}
              </div>
            </div>
            {isOwner && (
              <Link
                to={`/jobs/${job.jobId}/edit`}
                className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-center text-sm"
              >
                Edit
              </Link>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-4">
            <div className="flex items-center gap-2 text-gray-600">
              <FiDollarSign />
              <span className="font-semibold text-gray-900">₱{job.budget.toLocaleString()}</span>
            </div>
            {(job.city || job.province) && (
              <div className="flex items-center gap-2 text-gray-600">
                <FiMapPin />
                <span>{job.city && job.province ? `${job.city}, ${job.province}` : job.city || job.province}</span>
              </div>
            )}
            {job.estimatedHours && (
              <div className="flex items-center gap-2 text-gray-600">
                <FiClock />
                <span>{job.estimatedHours} hours</span>
              </div>
            )}
            {job.jobType && (
              <div className="flex items-center gap-2 text-gray-600">
                <FiUser />
                <span className="capitalize">{job.jobType}</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Description */}
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Description</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
            </div>

            {/* Required Skills */}
            {job.requiredSkills && job.requiredSkills.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Required Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {job.requiredSkills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Application Form (Tasker) */}
            {isTasker && job.status === "open" && (
              <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                {!showApplicationForm ? (
                  <button
                    onClick={() => setShowApplicationForm(true)}
                    className="w-full bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium hover:bg-blue-700 transition text-sm sm:text-base"
                  >
                    Apply for this Job
                  </button>
                ) : (
                  <div className="space-y-4">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">Submit Application</h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cover Letter (Optional)
                      </label>
                      <textarea
                        rows={4}
                        value={applicationData.coverLetter}
                        onChange={(e) =>
                          setApplicationData({ ...applicationData, coverLetter: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Tell the customer why you're perfect for this job..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Proposed Budget (Optional)
                      </label>
                      <input
                        type="number"
                        value={applicationData.proposedBudget}
                        onChange={(e) =>
                          setApplicationData({ ...applicationData, proposedBudget: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Leave empty to use job budget"
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                      <button
                        onClick={handleApply}
                        disabled={applying}
                        className="flex-1 bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 text-sm sm:text-base"
                      >
                        {applying ? "Submitting..." : "Submit Application"}
                      </button>
                      <button
                        onClick={() => {
                          setShowApplicationForm(false);
                          setApplicationData({ coverLetter: "", proposedBudget: "" });
                        }}
                        className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm sm:text-base"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            {/* Job Info Card */}
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Job Details</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-600">Status:</span>
                  <span className="ml-2 font-medium capitalize">{job.status.replace("_", " ")}</span>
                </div>
                <div>
                  <span className="text-gray-600">Applications:</span>
                  <span className="ml-2 font-medium">{job.applicationsCount}</span>
                </div>
                {job.deadline && (
                  <div>
                    <span className="text-gray-600">Deadline:</span>
                    <span className="ml-2 font-medium">
                      {new Date(job.deadline).toLocaleDateString()}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-gray-600">Posted:</span>
                  <span className="ml-2 font-medium">
                    {new Date(job.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions (Owner) */}
            {isOwner && (
              <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Actions</h3>
                <button
                  onClick={handleViewMatches}
                  className="w-full mb-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm sm:text-base"
                >
                  View Matched Taskers
                </button>
                <Link
                  to={`/jobs/${job.jobId}/applications`}
                  className="block w-full text-center border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition text-sm sm:text-base"
                >
                  View Applications ({applications.length})
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Matches Modal */}
        {showMatches && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-4 sm:p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Matched Taskers</h2>
                <button
                  onClick={() => setShowMatches(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4">
                {matches.length === 0 ? (
                  <p className="text-gray-500">No matches found</p>
                ) : (
                  matches.map((match: any) => (
                    <div
                      key={match.tasker?.userId}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {match.tasker?.firstName} {match.tasker?.lastName}
                          </h3>
                          <p className="text-sm text-gray-600">{match.tasker?.expertise}</p>
                        </div>
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                          {match.matchPercentage}% Match
                        </span>
                      </div>
                      {match.tasker?.skills && match.tasker.skills.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {match.tasker.skills.slice(0, 5).map((skill: string, idx: number) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                      <Link
                        to={`/users/${match.tasker?.userId}`}
                        className="mt-3 inline-block text-blue-600 hover:underline text-sm"
                      >
                        View Profile →
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobDetails;

