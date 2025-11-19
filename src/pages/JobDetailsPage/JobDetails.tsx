import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { FiMapPin, FiClock, FiUser, FiCheckCircle, FiX, FiEye, FiStar } from "react-icons/fi";
import { getJob, getJobMatches, getMatchPercentage, updateJob } from "../../lib/api/jobs.api";
import { createApplication, getJobApplications, getApplications, updateApplication } from "../../lib/api/applications.api";
import { getStoredAuthToken, getAuthenticatedUserFromToken } from "../../lib/utils/auth.utils";
import { GET } from "../../lib/utils/fetch.utils";
import { getJobReviews, createReview } from "../../lib/api/reviews.api";
import CreateReviewModal from "../ProfilePage/components/CreateReviewModal";
import EditReviewModal from "../ProfilePage/components/EditReviewModal";

type Job = {
  jobId: number;
  title: string;
  description: string;
  budget: number;
  city?: string;
  province?: string;
  requiredSkills?: string[];
  requiredExpertise?: string;
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
  const [posterName, setPosterName] = useState<string>("");
  const [hasApplied, setHasApplied] = useState(false);
  const [currentApplication, setCurrentApplication] = useState<any>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cooldownTime, setCooldownTime] = useState<number | null>(null);
  const [showApplicationsModal, setShowApplicationsModal] = useState(false);
  const [applicationsWithTaskers, setApplicationsWithTaskers] = useState<any[]>([]);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [viewingApplication, setViewingApplication] = useState<any>(null);
  const [viewingTasker, setViewingTasker] = useState<any>(null);
  const [viewingMatchPercentage, setViewingMatchPercentage] = useState<number | null>(null);
  const [processingApplication, setProcessingApplication] = useState(false);
  const [showStartTaskModal, setShowStartTaskModal] = useState(false);
  const [startingTask, setStartingTask] = useState(false);
  const [showTaskersModal, setShowTaskersModal] = useState(false);
  const [activeTaskers, setActiveTaskers] = useState<any[]>([]);
  const [firedTaskers, setFiredTaskers] = useState<any[]>([]);
  const [resignedTaskers, setResignedTaskers] = useState<any[]>([]);
  const [taskersTab, setTaskersTab] = useState<"active" | "fired" | "resigned">("active");
  const [loadingTaskers, setLoadingTaskers] = useState(false);
  const [finishingTask, setFinishingTask] = useState(false);
  const [cancellingTask, setCancellingTask] = useState(false);
  const [showResignModal, setShowResignModal] = useState(false);
  const [resignReason, setResignReason] = useState("");
  const [resigning, setResigning] = useState(false);
  const [showTerminateModal, setShowTerminateModal] = useState(false);
  const [terminatingApplication, setTerminatingApplication] = useState<any>(null);
  const [terminateReason, setTerminateReason] = useState("");
  const [terminating, setTerminating] = useState(false);
  const [showTerminationDetailsModal, setShowTerminationDetailsModal] = useState(false);
  const [viewingTerminationDetails, setViewingTerminationDetails] = useState<any>(null);
  const [showResignationDetailsModal, setShowResignationDetailsModal] = useState(false);
  const [viewingResignationDetails, setViewingResignationDetails] = useState<any>(null);
  const [allRated, setAllRated] = useState(false);
  const [unratedCount, setUnratedCount] = useState(0);
  const [checkingRatings, setCheckingRatings] = useState(false);
  const [showRateTaskersModal, setShowRateTaskersModal] = useState(false);
  const [taskersToRate, setTaskersToRate] = useState<any[]>([]);
  const [ratingTasker, setRatingTasker] = useState<any>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rateTaskersTab, setRateTaskersTab] = useState<"to-rate" | "rated">("to-rate");
  const [editingReview, setEditingReview] = useState<any>(null);
  const [showEditRatingModal, setShowEditRatingModal] = useState(false);
  const [showRateCustomerModal, setShowRateCustomerModal] = useState(false);
  const [rateCustomerTab, setRateCustomerTab] = useState<"to-rate" | "rated">("to-rate");
  const [showCustomerRatingModal, setShowCustomerRatingModal] = useState(false);
  const [showEditCustomerRatingModal, setShowEditCustomerRatingModal] = useState(false);
  const [customerReview, setCustomerReview] = useState<any>(null);
  const [hasRatedCustomer, setHasRatedCustomer] = useState(false);
  const [checkingCustomerRating, setCheckingCustomerRating] = useState(false);
  const [editingCustomerReview, setEditingCustomerReview] = useState<any>(null);
  const ratingsCheckedRef = useRef(false);
  const lastJobIdRef = useRef<number | null>(null);

  const user = getAuthenticatedUserFromToken<{ userId: number; role: string }>();
  const isTasker = user?.role === "tasker";
  const isCustomer = user?.role === "customer" || user?.role === "admin";
  const isOwner = job && user && job.customerId === user.userId;
  const jobIdNumber = job?.jobId;
  const jobCustomerId = job?.customerId;
  const currentUserId = user?.userId;
  const userJobApplication = applications.find(
    (app: any) => app.taskerId === currentUserId
  );
  const eligibleTaskerStatuses = ["accepted", "withdrawn"];
  const isEmployedTasker =
    !!userJobApplication &&
    eligibleTaskerStatuses.includes(
      (userJobApplication.status || "").toLowerCase()
    );
  const canRateCustomer =
    isTasker && job?.status === "finished" && isEmployedTasker;
  const customersToRateCount = canRateCustomer && !hasRatedCustomer ? 1 : 0;
  const customersRatedCount = canRateCustomer && hasRatedCustomer ? 1 : 0;

  const fetchCustomerReviewStatus = useCallback(async (): Promise<boolean> => {
    if (!jobIdNumber || !jobCustomerId || !currentUserId || !canRateCustomer) {
      setHasRatedCustomer(false);
      setCustomerReview(null);
      setCheckingCustomerRating(false);
      return false;
    }

    try {
      setCheckingCustomerRating(true);
      const reviewsResponse = await getJobReviews(jobIdNumber);
      let reviewsData: any[] = [];

      if (
        reviewsResponse?.response?.reviews &&
        Array.isArray(reviewsResponse.response.reviews)
      ) {
        reviewsData = reviewsResponse.response.reviews;
      } else if (
        reviewsResponse?.data?.response?.reviews &&
        Array.isArray(reviewsResponse.data.response.reviews)
      ) {
        reviewsData = reviewsResponse.data.response.reviews;
      } else if (Array.isArray(reviewsResponse?.response)) {
        reviewsData = reviewsResponse.response;
      } else if (Array.isArray(reviewsResponse?.data?.response)) {
        reviewsData = reviewsResponse.data.response;
      } else if (Array.isArray(reviewsResponse?.data)) {
        reviewsData = reviewsResponse.data;
      }

      const existingReview = reviewsData.find(
        (review: any) =>
          review?.taskerId === jobCustomerId &&
          review?.clientId === currentUserId
      );

      if (existingReview) {
        setHasRatedCustomer(true);
        setCustomerReview(existingReview);
        return true;
      } else {
        setHasRatedCustomer(false);
        setCustomerReview(null);
        return false;
      }
    } catch (error) {
      console.error("Check customer rating error:", error);
      setHasRatedCustomer(false);
      setCustomerReview(null);
      return false;
    } finally {
      setCheckingCustomerRating(false);
    }
  }, [jobIdNumber, jobCustomerId, currentUserId, canRateCustomer]);

  // Update cooldown timer
  useEffect(() => {
    if (cooldownTime && cooldownTime > 0) {
      const interval = setInterval(() => {
        const cooldownKey = `app_cancelled_${jobId}_${user?.userId}`;
        const cancelledTime = localStorage.getItem(cooldownKey);
        if (cancelledTime) {
          const timeDiff = Date.now() - parseInt(cancelledTime);
          const oneHour = 60 * 60 * 1000;
          if (timeDiff < oneHour) {
            setCooldownTime(oneHour - timeDiff);
          } else {
            localStorage.removeItem(cooldownKey);
            setCooldownTime(null);
          }
        } else {
          setCooldownTime(null);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [cooldownTime, jobId, user?.userId]);

  useEffect(() => {
    fetchCustomerReviewStatus();
  }, [fetchCustomerReviewStatus]);

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
          
          // Fetch poster name
          if (jobData.customerId) {
            try {
              const userResponse = await GET<any>(`/users/${jobData.customerId}/public`, "", token);
              const userData = userResponse?.response || userResponse?.data || userResponse;
              if (userData?.firstName && userData?.lastName) {
                setPosterName(`${userData.firstName} ${userData.lastName}`);
              }
            } catch (err) {
              console.error("Fetch poster name error:", err);
            }
          }
          
          // If tasker, get match percentage and check if already applied
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

            // Check if tasker has already applied
            try {
              const myAppsResponse = await getApplications({ jobId: Number(jobId), taskerId: user.userId });
              // axios returns: { data: { status, response, message } }
              let myAppsData: any[] = [];
              if (myAppsResponse?.data?.response && Array.isArray(myAppsResponse.data.response)) {
                myAppsData = myAppsResponse.data.response;
              } else if (Array.isArray(myAppsResponse?.data)) {
                myAppsData = myAppsResponse.data;
              }
              
              if (myAppsData.length > 0) {
                setHasApplied(true);
                setCurrentApplication(myAppsData[0]);
              } else {
                setHasApplied(false);
                setCurrentApplication(null);
              }
              
              // Check for cooldown period
              const cooldownKey = `app_cancelled_${jobId}_${user.userId}`;
              const cancelledTime = localStorage.getItem(cooldownKey);
              if (cancelledTime) {
                const timeDiff = Date.now() - parseInt(cancelledTime);
                const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds
                if (timeDiff < oneHour) {
                  const remainingTime = oneHour - timeDiff;
                  setCooldownTime(remainingTime);
                } else {
                  localStorage.removeItem(cooldownKey);
                  setCooldownTime(null);
                }
              }
            } catch (err) {
              console.error("Check application error:", err);
              setHasApplied(false);
              setCurrentApplication(null);
            }
          }

          // Get applications (for both owner and tasker to see counts)
          try {
            const appsResponse = await getJobApplications(Number(jobId));
            // axios returns: { data: { status, response, message } }
            let appsData: any[] = [];
            if (appsResponse?.data?.response && Array.isArray(appsResponse.data.response)) {
              appsData = appsResponse.data.response;
            } else if (Array.isArray(appsResponse?.data)) {
              appsData = appsResponse.data;
            }
            setApplications(appsData);
          } catch (err) {
            console.error("Fetch applications error:", err);
            setApplications([]);
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

  // Reset rating check when job changes
  useEffect(() => {
    if (job?.jobId !== lastJobIdRef.current) {
      ratingsCheckedRef.current = false;
      lastJobIdRef.current = null;
    }
  }, [job?.jobId]);

  // Check if all active taskers are rated when job is finished
  useEffect(() => {
    const checkRatings = async () => {
      if (!job || job.status !== "finished" || !isOwner || !user) {
        ratingsCheckedRef.current = false;
        return;
      }

      // Prevent re-checking if we've already checked for this job
      if (ratingsCheckedRef.current && lastJobIdRef.current === job.jobId) {
        return;
      }

      try {
        setCheckingRatings(true);
        lastJobIdRef.current = job.jobId;
        
        // Get all accepted applications (active taskers)
        const acceptedApps = applications.filter(
          (app: any) => app.status?.toLowerCase() === "accepted"
        );

        if (acceptedApps.length === 0) {
          setAllRated(true);
          setUnratedCount(0);
          setTaskersToRate([]);
          ratingsCheckedRef.current = true;
          return;
        }

        // Get all reviews for this job
        const reviewsResponse = await getJobReviews(job.jobId);
        let reviewsData: any[] = [];
        
        // Extract reviews array from response
        if (reviewsResponse?.response?.reviews) {
          reviewsData = Array.isArray(reviewsResponse.response.reviews) ? reviewsResponse.response.reviews : [];
        } else if (reviewsResponse?.data?.response?.reviews) {
          reviewsData = Array.isArray(reviewsResponse.data.response.reviews) ? reviewsResponse.data.response.reviews : [];
        } else if (Array.isArray(reviewsResponse?.response)) {
          reviewsData = reviewsResponse.response;
        } else if (Array.isArray(reviewsResponse?.data?.response)) {
          reviewsData = reviewsResponse.data.response;
        } else if (Array.isArray(reviewsResponse?.data)) {
          reviewsData = reviewsResponse.data;
        }

        // Create a map of taskerId to review data
        const reviewMap = new Map();
        reviewsData.forEach((review: any) => {
          if (review?.taskerId) {
            reviewMap.set(review.taskerId, {
              reviewId: review.reviewId,
              rating: review.rating,
              comment: review.comment,
              edited: review.edited || false,
            });
          }
        });

        // Get rated tasker IDs
        const ratedTaskerIds = new Set(reviewsData.map((r: any) => r?.taskerId).filter(Boolean));

        // Calculate unrated count
        const unratedApps = acceptedApps.filter((app: any) => !ratedTaskerIds.has(app.taskerId));
        setUnratedCount(unratedApps.length);
        setAllRated(unratedApps.length === 0);

        // Fetch tasker info and prepare list
        const taskersList = await Promise.all(
          acceptedApps.map(async (app: any) => {
            try {
              const token = getStoredAuthToken();
              const taskerResponse = await GET(`/users/${app.taskerId}/public`, "", token);
              const taskerData = taskerResponse?.response || taskerResponse?.data || taskerResponse;
              const reviewData = reviewMap.get(app.taskerId) || null;
              
              return {
                ...app,
                taskerInfo: taskerData || null,
                isRated: ratedTaskerIds.has(app.taskerId),
                review: reviewData,
              };
            } catch (err) {
              const reviewData = reviewMap.get(app.taskerId) || null;
              return {
                ...app,
                taskerInfo: null,
                isRated: ratedTaskerIds.has(app.taskerId),
                review: reviewData,
              };
            }
          })
        );

        setTaskersToRate(taskersList);
        ratingsCheckedRef.current = true;
      } catch (error) {
        console.error("Check ratings error:", error);
        ratingsCheckedRef.current = false;
      } finally {
        setCheckingRatings(false);
      }
    };

    checkRatings();
  }, [job?.jobId, job?.status, applications.length, isOwner, user?.userId]);

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
      setHasApplied(true); // Mark as applied
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
      // Fetch matches
      const response = await getJobMatches(Number(jobId));
      // axios returns: { data: { status, response, message } }
      let matchesData: any[] = [];
      if (response?.data?.response && Array.isArray(response.data.response)) {
        matchesData = response.data.response;
      } else if (Array.isArray(response?.data)) {
        matchesData = response.data;
      }

      // Fetch applications to enrich match data with application info
      try {
        const appsResponse = await getJobApplications(Number(jobId));
        let appsData: any[] = [];
        if (appsResponse?.data?.response && Array.isArray(appsResponse.data.response)) {
          appsData = appsResponse.data.response;
        } else if (Array.isArray(appsResponse?.data)) {
          appsData = appsResponse.data;
        }

        // Enrich matches with application data
        matchesData = matchesData.map((match: any) => {
          const application = appsData.find((app: any) => app.taskerId === match.tasker?.userId);
          return {
            ...match,
            application: application || null,
          };
        });
      } catch (err) {
        console.error("Fetch applications for matches error:", err);
        // Continue without application data
      }

      setMatches(matchesData);
      setShowMatches(true);
    } catch (error) {
      console.error("Fetch matches error:", error);
      setMatches([]);
      setShowMatches(true);
    }
  };

  const handleViewApplications = async () => {
    if (!jobId) return;
    setLoadingApplications(true);
    setShowApplicationsModal(true);
    
    try {
      const appsResponse = await getJobApplications(Number(jobId));
      let appsData: any[] = [];
      if (appsResponse?.data?.response && Array.isArray(appsResponse.data.response)) {
        appsData = appsResponse.data.response;
      } else if (Array.isArray(appsResponse?.data)) {
        appsData = appsResponse.data;
      }

      // Fetch tasker information for each application
      const appsWithTaskers = await Promise.all(
        appsData.map(async (app: any) => {
          try {
            const token = getStoredAuthToken();
            if (!token) return { ...app, taskerInfo: null };
            
            const userResponse = await GET<any>(`/users/${app.taskerId}/public`, "", token);
            const userData = userResponse?.response || userResponse?.data || userResponse;
            return {
              ...app,
              taskerInfo: userData || null,
            };
          } catch (err) {
            console.error(`Error fetching tasker ${app.taskerId}:`, err);
            return { ...app, taskerInfo: null };
          }
        })
      );

      setApplicationsWithTaskers(appsWithTaskers);
    } catch (error) {
      console.error("Fetch applications error:", error);
      setApplicationsWithTaskers([]);
    } finally {
      setLoadingApplications(false);
    }
  };

  const handleViewApplicationDetails = async (application: any) => {
    setViewingApplication(application);
    setViewingTasker(application.taskerInfo);
    setViewingMatchPercentage(null);
    
    // Fetch match percentage for this tasker and job
    if (application.taskerId && jobId) {
      try {
        const matchResponse = await getMatchPercentage(Number(jobId), application.taskerId);
        const matchData = matchResponse?.data?.response || matchResponse?.data?.data || matchResponse?.data;
        if (matchData?.matchPercentage !== undefined) {
          setViewingMatchPercentage(matchData.matchPercentage);
        }
      } catch (err) {
        console.error("Failed to fetch match percentage:", err);
      }
    }
  };

  const handleAcceptApplication = async (applicationId: number) => {
    if (!job || !user || !isOwner) return;

    const token = getStoredAuthToken();
    if (!token) {
      navigate("/login");
      return;
    }

    if (!confirm("Are you sure you want to accept this application?")) {
      return;
    }

    try {
      setProcessingApplication(true);
      await updateApplication(applicationId, { status: 'accepted' });
      alert("Application accepted successfully!");

      // Refresh applications list
      if (isOwner) {
        try {
          const appsResponse = await getJobApplications(Number(jobId));
          let appsData: any[] = [];
          if (appsResponse?.data?.response && Array.isArray(appsResponse.data.response)) {
            appsData = appsResponse.data.response;
          } else if (Array.isArray(appsResponse?.data)) {
            appsData = appsResponse.data;
          }
          setApplications(appsData);

          // Update applicationsWithTaskers
          const appsWithTaskers = await Promise.all(
            appsData.map(async (app: any) => {
              try {
                const token = getStoredAuthToken();
                if (!token) return { ...app, taskerInfo: null };
                
                const userResponse = await GET<any>(`/users/${app.taskerId}/public`, "", token);
                const userData = userResponse?.response || userResponse?.data || userResponse;
                return {
                  ...app,
                  taskerInfo: userData || null,
                };
              } catch (err) {
                console.error(`Error fetching tasker ${app.taskerId}:`, err);
                return { ...app, taskerInfo: null };
              }
            })
          );
          setApplicationsWithTaskers(appsWithTaskers);

          // Update viewing application if it's the same one
          if (viewingApplication && viewingApplication.applicationId === applicationId) {
            const updatedApp = appsWithTaskers.find((a: any) => a.applicationId === applicationId);
            if (updatedApp) {
              setViewingApplication(updatedApp);
            }
          }
        } catch (err) {
          console.error("Refresh applications error:", err);
        }
      }
    } catch (error: any) {
      console.error("Accept application error:", error);
      alert(error.response?.data?.message || "Failed to accept application");
    } finally {
      setProcessingApplication(false);
    }
  };

  const handleRejectApplication = async (applicationId: number) => {
    if (!job || !user || !isOwner) return;

    const token = getStoredAuthToken();
    if (!token) {
      navigate("/login");
      return;
    }

    if (!confirm("Are you sure you want to reject this application?")) {
      return;
    }

    try {
      setProcessingApplication(true);
      await updateApplication(applicationId, { status: 'rejected' });
      alert("Application rejected.");

      // Refresh applications list
      if (isOwner) {
        try {
          const appsResponse = await getJobApplications(Number(jobId));
          let appsData: any[] = [];
          if (appsResponse?.data?.response && Array.isArray(appsResponse.data.response)) {
            appsData = appsResponse.data.response;
          } else if (Array.isArray(appsResponse?.data)) {
            appsData = appsResponse.data;
          }
          setApplications(appsData);

          // Update applicationsWithTaskers
          const appsWithTaskers = await Promise.all(
            appsData.map(async (app: any) => {
              try {
                const token = getStoredAuthToken();
                if (!token) return { ...app, taskerInfo: null };
                
                const userResponse = await GET<any>(`/users/${app.taskerId}/public`, "", token);
                const userData = userResponse?.response || userResponse?.data || userResponse;
                return {
                  ...app,
                  taskerInfo: userData || null,
                };
              } catch (err) {
                console.error(`Error fetching tasker ${app.taskerId}:`, err);
                return { ...app, taskerInfo: null };
              }
            })
          );
          setApplicationsWithTaskers(appsWithTaskers);

          // Update viewing application if it's the same one
          if (viewingApplication && viewingApplication.applicationId === applicationId) {
            const updatedApp = appsWithTaskers.find((a: any) => a.applicationId === applicationId);
            if (updatedApp) {
              setViewingApplication(updatedApp);
            }
          }
        } catch (err) {
          console.error("Refresh applications error:", err);
        }
      }
    } catch (error: any) {
      console.error("Reject application error:", error);
      alert(error.response?.data?.message || "Failed to reject application");
    } finally {
      setProcessingApplication(false);
    }
  };

  // Calculate hired and rejected counts
  const hiredCount = applications.filter((app: any) => app.status?.toLowerCase() === "accepted").length;
  const rejectedCount = applications.filter((app: any) => app.status?.toLowerCase() === "rejected").length;

  const handleStartTask = async () => {
    if (!job || !user || !isOwner) return;

    const token = getStoredAuthToken();
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setStartingTask(true);
      await updateJob(job.jobId, { status: "in_progress" });
      alert("Task started successfully!");

      // Refresh job data
      try {
        const response = await getJob(Number(jobId));
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
        }
      } catch (err) {
        console.error("Refresh job error:", err);
      }

      setShowStartTaskModal(false);
    } catch (error: any) {
      console.error("Start task error:", error);
      alert(error.response?.data?.message || "Failed to start task");
    } finally {
      setStartingTask(false);
    }
  };

  const handleViewTaskers = async () => {
    if (!job || !user || !isOwner) return;

    const token = getStoredAuthToken();
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setLoadingTaskers(true);
      setShowTaskersModal(true);

      // Get all applications for this job
      const appsResponse = await getJobApplications(Number(jobId));
      console.log("Apps Response:", appsResponse);
      
      let appsData: any[] = [];
      if (appsResponse?.data?.response && Array.isArray(appsResponse.data.response)) {
        appsData = appsResponse.data.response;
      } else if (appsResponse?.data?.data && Array.isArray(appsResponse.data.data)) {
        appsData = appsResponse.data.data;
      } else if (Array.isArray(appsResponse?.data)) {
        appsData = appsResponse.data;
      } else if (Array.isArray(appsResponse?.response)) {
        appsData = appsResponse.response;
      }
      
      console.log("Apps Data:", appsData);

      // Separate active (accepted), fired (rejected), and resigned (withdrawn) taskers
      const acceptedApps = appsData.filter((app: any) => app.status?.toLowerCase() === "accepted");
      const rejectedApps = appsData.filter((app: any) => app.status?.toLowerCase() === "rejected");
      const withdrawnApps = appsData.filter((app: any) => app.status?.toLowerCase() === "withdrawn");
      
      console.log("Accepted Apps:", acceptedApps);
      console.log("Rejected Apps:", rejectedApps);
      console.log("Withdrawn Apps:", withdrawnApps);

      // Fetch tasker info for accepted applications
      const activeTaskersList: any[] = [];
      for (const app of acceptedApps) {
        try {
          const taskerResponse = await GET(`/users/${app.taskerId}/public`, "", token);
          console.log(`Tasker ${app.taskerId} response:`, taskerResponse);
          const taskerData = taskerResponse?.response || taskerResponse?.data || taskerResponse;
          
          activeTaskersList.push({
            ...app,
            taskerInfo: taskerData || null,
          });
        } catch (err) {
          console.error(`Failed to fetch tasker ${app.taskerId}:`, err);
          // Still add the application even if tasker info fetch fails
          activeTaskersList.push({
            ...app,
            taskerInfo: null,
          });
        }
      }

      // Fetch tasker info for rejected applications
      const firedTaskersList: any[] = [];
      for (const app of rejectedApps) {
        try {
          const taskerResponse = await GET(`/users/${app.taskerId}/public`, "", token);
          const taskerData = taskerResponse?.response || taskerResponse?.data || taskerResponse;
          
          firedTaskersList.push({
            ...app,
            taskerInfo: taskerData || null,
          });
        } catch (err) {
          console.error(`Failed to fetch tasker ${app.taskerId}:`, err);
          // Still add the application even if tasker info fetch fails
          firedTaskersList.push({
            ...app,
            taskerInfo: null,
          });
        }
      }

      // Fetch tasker info for withdrawn applications (resigned)
      const resignedTaskersList: any[] = [];
      for (const app of withdrawnApps) {
        try {
          const taskerResponse = await GET(`/users/${app.taskerId}/public`, "", token);
          const taskerData = taskerResponse?.response || taskerResponse?.data || taskerResponse;
          
          resignedTaskersList.push({
            ...app,
            taskerInfo: taskerData || null,
          });
        } catch (err) {
          console.error(`Failed to fetch tasker ${app.taskerId}:`, err);
          // Still add the application even if tasker info fetch fails
          resignedTaskersList.push({
            ...app,
            taskerInfo: null,
          });
        }
      }

      console.log("Active Taskers List:", activeTaskersList);
      console.log("Fired Taskers List:", firedTaskersList);
      console.log("Resigned Taskers List:", resignedTaskersList);

      setActiveTaskers(activeTaskersList);
      setFiredTaskers(firedTaskersList);
      setResignedTaskers(resignedTaskersList);
    } catch (error) {
      console.error("View taskers error:", error);
      alert("Failed to load taskers");
    } finally {
      setLoadingTaskers(false);
    }
  };

  const handleTerminate = async () => {
    if (!terminatingApplication || !terminateReason.trim()) {
      alert("Please provide a reason for termination.");
      return;
    }

    const token = getStoredAuthToken();
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setTerminating(true);
      await updateApplication(terminatingApplication.applicationId, { 
        status: 'rejected',
        coverLetter: terminateReason // Store termination reason in coverLetter field
      });
      alert("Tasker terminated successfully.");

      // Refresh taskers list
      await handleViewTaskers();

      setShowTerminateModal(false);
      setTerminatingApplication(null);
      setTerminateReason("");
    } catch (error: any) {
      console.error("Terminate error:", error);
      alert(error.response?.data?.message || "Failed to terminate tasker");
    } finally {
      setTerminating(false);
    }
  };

  const handleViewTerminationDetails = (application: any) => {
    setViewingTerminationDetails(application);
    setShowTerminationDetailsModal(true);
  };

  const handleViewResignationDetails = (application: any) => {
    setViewingResignationDetails(application);
    setShowResignationDetailsModal(true);
  };

  const handleResign = async () => {
    if (!job || !user || !isTasker) return;
    if (!resignReason.trim()) {
      alert("Please provide a reason for resigning.");
      return;
    }

    const token = getStoredAuthToken();
    if (!token) {
      navigate("/login");
      return;
    }

    // Find the tasker's application for this job
    const taskerApplication = applications.find(
      (app: any) => app.taskerId === user.userId && app.status?.toLowerCase() === "accepted"
    );

    if (!taskerApplication) {
      alert("You are not currently employed in this job.");
      return;
    }

    try {
      setResigning(true);
      await updateApplication(taskerApplication.applicationId, { 
        status: 'withdrawn',
        coverLetter: resignReason // Using coverLetter field to store resignation reason
      });
      alert("You have successfully resigned from this job.");

      // Refresh job data and applications
      try {
        const response = await getJob(Number(jobId));
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
        }

        // Refresh applications
        const appsResponse = await getJobApplications(Number(jobId));
        let appsData: any[] = [];
        if (appsResponse?.data?.response && Array.isArray(appsResponse.data.response)) {
          appsData = appsResponse.data.response;
        } else if (Array.isArray(appsResponse?.data)) {
          appsData = appsResponse.data;
        }
        setApplications(appsData);
      } catch (err) {
        console.error("Refresh job error:", err);
      }

      setShowResignModal(false);
      setResignReason("");
    } catch (error: any) {
      console.error("Resign error:", error);
      alert(error.response?.data?.message || "Failed to resign from job");
    } finally {
      setResigning(false);
    }
  };

  const handleFinishTask = async () => {
    if (!job || !user || !isOwner) return;

    const token = getStoredAuthToken();
    if (!token) {
      navigate("/login");
      return;
    }

    if (!window.confirm("Are you sure you want to finish this task? This action cannot be undone.")) {
      return;
    }

    try {
      setFinishingTask(true);
      await updateJob(job.jobId, { status: "finished" });
      alert("Task finished successfully!");

      // Refresh job data
      try {
        const response = await getJob(Number(jobId));
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
        }
      } catch (err) {
        console.error("Refresh job error:", err);
      }
    } catch (error: any) {
      console.error("Finish task error:", error);
      alert(error.response?.data?.message || "Failed to finish task");
    } finally {
      setFinishingTask(false);
    }
  };

  const handleCancelTask = async () => {
    if (!job || !user || !isOwner) return;

    const token = getStoredAuthToken();
    if (!token) {
      navigate("/login");
      return;
    }

    if (!window.confirm("Are you sure you want to cancel this task? This action cannot be undone.")) {
      return;
    }

    try {
      setCancellingTask(true);
      await updateJob(job.jobId, { status: "cancelled" });
      alert("Task cancelled successfully!");

      // Refresh job data
      try {
        const response = await getJob(Number(jobId));
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
        }
      } catch (err) {
        console.error("Refresh job error:", err);
      }
    } catch (error: any) {
      console.error("Cancel task error:", error);
      alert(error.response?.data?.message || "Failed to cancel task");
    } finally {
      setCancellingTask(false);
    }
  };

  const handleHireTasker = async (taskerId: number, applicationId?: number) => {
    if (!job || !user || !isOwner) return;

    const token = getStoredAuthToken();
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      // If applicationId is provided, use it directly
      let appId = applicationId;
      
      // If not provided, find the application
      if (!appId) {
        const appsResponse = await getApplications({ jobId: job.jobId, taskerId });
        let appsData: any[] = [];
        
        if (appsResponse?.data?.response && Array.isArray(appsResponse.data.response)) {
          appsData = appsResponse.data.response;
        } else if (Array.isArray(appsResponse?.data)) {
          appsData = appsResponse.data;
        }
        
        const existingApp = appsData.find((app: any) => app.taskerId === taskerId);
        if (existingApp) {
          appId = existingApp.applicationId;
        }
      }

      if (!appId) {
        alert("This tasker has not applied to this job yet. They need to apply first.");
        return;
      }

      // Accept the application
      await updateApplication(appId, { status: 'accepted' });
      alert("Tasker hired successfully!");

      // Refresh applications list
      if (isOwner) {
        try {
          const appsResponse = await getJobApplications(Number(jobId));
          let appsData: any[] = [];
          if (appsResponse?.data?.response && Array.isArray(appsResponse.data.response)) {
            appsData = appsResponse.data.response;
          } else if (Array.isArray(appsResponse?.data)) {
            appsData = appsResponse.data;
          }
          setApplications(appsData);
        } catch (err) {
          console.error("Refresh applications error:", err);
        }
      }

      // Refresh matches to update the UI
      handleViewMatches();
    } catch (error: any) {
      console.error("Hire tasker error:", error);
      alert(error.response?.data?.message || "Failed to hire tasker");
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
          <Link to="/jobs" className="text-blue-700 hover:underline">
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
                  job.status === "open" ? "bg-green-200 text-green-800" :
                  job.status === "in_progress" ? "bg-blue-200 text-blue-800" :
                  job.status === "finished" ? "bg-purple-200 text-purple-800" :
                  job.status === "completed" ? "bg-gray-100 text-gray-800" :
                  "bg-red-200 text-red-800"
                }`}>
                  {job.status.replace("_", " ").toUpperCase()}
                </span>
                {matchPercentage !== null && (
                  <span className="px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-blue-200 text-blue-800">
                    {matchPercentage}% Match
                  </span>
                )}
              </div>
            </div>
            {isOwner && job.status !== "in_progress" && (
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
              <span className="text-lg font-semibold text-gray-700">₱</span>
              <span className="font-semibold text-gray-900">{job.budget.toLocaleString()}</span>
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
          
          {posterName && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2 text-gray-600">
                <FiUser className="w-4 h-4" />
                <span className="text-sm">
                  <span className="text-gray-500">Posted by:</span>{" "}
                  <span className="font-semibold text-gray-900">{posterName}</span>
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Description */}
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Description</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
            </div>

            {/* Required Expertise */}
            {job.requiredExpertise && (
              <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Required Expertise</h2>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-green-200 text-green-800 rounded-full text-sm font-medium">
                    {job.requiredExpertise}
                  </span>
                </div>
              </div>
            )}

            {/* Required Skills */}
            {job.requiredSkills && job.requiredSkills.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Required Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {job.requiredSkills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-blue-200 text-blue-800 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Applications List (Owner) */}
            {isOwner && applications.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">
                  Applications ({applications.length})
                </h2>
                <div className="space-y-3">
                  {applications.map((app: any) => (
                    <div
                      key={app.applicationId}
                      className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            Application #{app.applicationId}
                          </p>
                          <p className="text-sm text-gray-600">
                            Status: <span className={`font-medium ${
                              app.status === "accepted" ? "text-green-700" :
                              app.status === "rejected" ? "text-red-700" :
                              "text-yellow-700"
                            }`}>
                              {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                            </span>
                          </p>
                        </div>
                        {app.proposedBudget && (
                          <div className="text-right">
                            <p className="text-sm text-gray-600">Proposed Budget</p>
                            <p className="font-semibold text-gray-900">₱{app.proposedBudget.toLocaleString()}</p>
                          </div>
                        )}
                      </div>
                      {app.coverLetter && (
                        <p className="text-sm text-gray-700 mt-2 line-clamp-2">
                          {app.coverLetter}
                        </p>
                      )}
                      <Link
                        to={`/users/${app.taskerId}`}
                        className="mt-2 inline-block text-sm text-blue-700 hover:underline"
                      >
                        View Tasker Profile →
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Application Form (Tasker) */}
            {isTasker && job.status === "open" && (
              <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                {hasApplied && currentApplication?.status !== "withdrawn" ? (
                  <div className="text-center py-4 space-y-3">
                    <p className="text-gray-700 font-medium mb-2">You have already applied to this job</p>
                    <p className="text-sm text-gray-500">Check your applications page to see the status</p>
                    {currentApplication?.status === "pending" && (
                      <button
                        onClick={async () => {
                          if (!confirm("Are you sure you want to cancel this application? You will need to wait 1 hour before applying again.")) {
                            return;
                          }
                          
                          try {
                            setCancelling(true);
                            await updateApplication(currentApplication.applicationId, { status: "withdrawn" });
                            
                            // Store cancellation time in localStorage
                            const cooldownKey = `app_cancelled_${jobId}_${user?.userId}`;
                            localStorage.setItem(cooldownKey, Date.now().toString());
                            
                            setHasApplied(false);
                            setCurrentApplication(null);
                            setCooldownTime(60 * 60 * 1000); // 1 hour
                            alert("Application cancelled successfully. You can re-apply after 1 hour.");
                          } catch (error: any) {
                            console.error("Cancel application error:", error);
                            alert(error.response?.data?.message || "Failed to cancel application");
                          } finally {
                            setCancelling(false);
                          }
                        }}
                        disabled={cancelling}
                        className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
                      >
                        {cancelling ? "Cancelling..." : "Cancel Application"}
                      </button>
                    )}
                  </div>
                ) : cooldownTime && cooldownTime > 0 ? (
                  <div className="text-center py-4">
                    <p className="text-gray-700 font-medium mb-2">Application Cancelled</p>
                    <p className="text-sm text-gray-500 mb-3">
                      You can re-apply in {Math.ceil(cooldownTime / (60 * 1000))} minutes
                    </p>
                    <button
                      onClick={() => {
                        // Update cooldown display every second
                        const interval = setInterval(() => {
                          const cooldownKey = `app_cancelled_${jobId}_${user?.userId}`;
                          const cancelledTime = localStorage.getItem(cooldownKey);
                          if (cancelledTime) {
                            const timeDiff = Date.now() - parseInt(cancelledTime);
                            const oneHour = 60 * 60 * 1000;
                            if (timeDiff < oneHour) {
                              setCooldownTime(oneHour - timeDiff);
                            } else {
                              localStorage.removeItem(cooldownKey);
                              setCooldownTime(null);
                              clearInterval(interval);
                            }
                          } else {
                            setCooldownTime(null);
                            clearInterval(interval);
                          }
                        }, 1000);
                        setTimeout(() => clearInterval(interval), cooldownTime);
                      }}
                      className="w-full bg-gray-400 text-white px-4 py-2 rounded-lg font-medium cursor-not-allowed"
                      disabled
                    >
                      Apply for this Job (Cooldown Active)
                    </button>
                  </div>
                ) : !showApplicationForm ? (
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
                <div>
                  <span className="text-gray-600">Hired:</span>
                  <span className="ml-2 font-medium text-green-700">{hiredCount}</span>
                </div>
                <div>
                  <span className="text-gray-600">Rejected:</span>
                  <span className="ml-2 font-medium text-red-700">{rejectedCount}</span>
                </div>
                {job.status === "finished" && (
                  <div>
                    {isOwner ? (
                      checkingRatings ? (
                        <span className="text-gray-500 text-sm">Checking ratings...</span>
                      ) : allRated ? (
                        <span className="px-3 py-1 bg-green-200 text-green-800 rounded-full text-sm font-medium">
                          Customer Rated
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-yellow-200 text-yellow-800 rounded-full text-sm font-medium">
                          {unratedCount} Customer{unratedCount !== 1 ? "s" : ""} to Rate
                        </span>
                      )
                    ) : canRateCustomer ? (
                      checkingCustomerRating ? (
                        <span className="text-gray-500 text-sm">Checking ratings...</span>
                      ) : hasRatedCustomer ? (
                        <span className="px-3 py-1 bg-green-200 text-green-800 rounded-full text-sm font-medium">
                          Customer Rated
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-yellow-200 text-yellow-800 rounded-full text-sm font-medium">
                          {customersToRateCount} Customer{customersToRateCount !== 1 ? "s" : ""} to Rate
                        </span>
                      )
                    ) : null}
                  </div>
                )}
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

            {/* Application / Task Status */}
            {isTasker && (
              <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
                  Status Overview
                </h3>
                <div className="space-y-3 text-sm">
                  {hasApplied && currentApplication && (
                    <div>
                      <span className="text-gray-600">Application Status:</span>
                      <span
                        className={`ml-2 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                          (currentApplication.status || "").toLowerCase() === "accepted"
                            ? "bg-green-100 text-green-800"
                            : (currentApplication.status || "").toLowerCase() === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : (currentApplication.status || "").toLowerCase() === "rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {currentApplication.status
                          ? currentApplication.status.replace("_", " ").toUpperCase()
                          : "N/A"}
                      </span>
                    </div>
                  )}

                  {(() => {
                    if (!currentApplication?.status) return null;
                    const statusLower = currentApplication.status.toLowerCase();
                    let employmentLabel = "";
                    let employmentClasses =
                      "ml-2 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ";

                    if (statusLower === "accepted") {
                      employmentLabel = "Hired";
                      employmentClasses += "bg-green-100 text-green-800";
                    } else if (statusLower === "rejected") {
                      employmentLabel = "Fired";
                      employmentClasses += "bg-red-100 text-red-800";
                    } else if (statusLower === "withdrawn") {
                      employmentLabel = "Resigned";
                      employmentClasses += "bg-yellow-100 text-yellow-800";
                    }

                    if (!employmentLabel) return null;

                    return (
                      <div>
                        <span className="text-gray-600">Employment Status:</span>
                        <span className={employmentClasses}>{employmentLabel}</span>
                      </div>
                    );
                  })()}

                  {currentApplication?.status &&
                    currentApplication.status.toLowerCase() === "accepted" && (
                      <div>
                        <span className="text-gray-600">Task Status:</span>
                        <span className="ml-2 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-800">
                          {job?.status ? job.status.replace("_", " ").toUpperCase() : "N/A"}
                        </span>
                      </div>
                    )}

                  {!hasApplied && (
                    <p className="text-gray-500 text-sm">
                      You have not applied to this job yet.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Actions (Owner) */}
            {isOwner && (
              <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Actions</h3>
                {job.status === "in_progress" ? (
                  <>
                    <button
                      onClick={handleViewTaskers}
                      className="w-full mb-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm sm:text-base"
                    >
                      View Taskers
                    </button>
                    <button
                      onClick={handleFinishTask}
                      disabled={finishingTask}
                      className="w-full mb-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {finishingTask ? "Finishing..." : "Finish Task"}
                    </button>
                    <button
                      onClick={handleCancelTask}
                      disabled={cancellingTask}
                      className="w-full mb-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {cancellingTask ? "Cancelling..." : "Cancel Task"}
                    </button>
                  </>
                ) : job.status === "finished" ? (
                  <button
                    onClick={async () => {
                      setShowRateTaskersModal(true);
                      // Force refresh when opening modal
                      ratingsCheckedRef.current = false;
                      // Manually fetch data
                      if (job) {
                        try {
                          setCheckingRatings(true);
                          const acceptedApps = applications.filter(
                            (app: any) => app.status?.toLowerCase() === "accepted"
                          );

                          if (acceptedApps.length > 0) {
                            const reviewsResponse = await getJobReviews(job.jobId);
                            let reviewsData: any[] = [];
                            
                            if (reviewsResponse?.response?.reviews) {
                              reviewsData = Array.isArray(reviewsResponse.response.reviews) ? reviewsResponse.response.reviews : [];
                            } else if (reviewsResponse?.data?.response?.reviews) {
                              reviewsData = Array.isArray(reviewsResponse.data.response.reviews) ? reviewsResponse.data.response.reviews : [];
                            } else if (Array.isArray(reviewsResponse?.response)) {
                              reviewsData = reviewsResponse.response;
                            } else if (Array.isArray(reviewsResponse?.data?.response)) {
                              reviewsData = reviewsResponse.data.response;
                            } else if (Array.isArray(reviewsResponse?.data)) {
                              reviewsData = reviewsResponse.data;
                            }

                            const reviewMap = new Map();
                            reviewsData.forEach((review: any) => {
                              if (review?.taskerId) {
                                reviewMap.set(review.taskerId, {
                                  reviewId: review.reviewId,
                                  rating: review.rating,
                                  comment: review.comment,
                                  edited: review.edited || false,
                                });
                              }
                            });

                            const ratedTaskerIds = new Set(reviewsData.map((r: any) => r?.taskerId).filter(Boolean));
                            const unratedApps = acceptedApps.filter((app: any) => !ratedTaskerIds.has(app.taskerId));

                            setUnratedCount(unratedApps.length);
                            setAllRated(unratedApps.length === 0);

                            const taskersList = await Promise.all(
                              acceptedApps.map(async (app: any) => {
                                try {
                                  const token = getStoredAuthToken();
                                  const taskerResponse = await GET(`/users/${app.taskerId}/public`, "", token);
                                  const taskerData = taskerResponse?.response || taskerResponse?.data || taskerResponse;
                                  const reviewData = reviewMap.get(app.taskerId) || null;
                                  return {
                                    ...app,
                                    taskerInfo: taskerData || null,
                                    isRated: ratedTaskerIds.has(app.taskerId),
                                    review: reviewData,
                                  };
                                } catch (err) {
                                  const reviewData = reviewMap.get(app.taskerId) || null;
                                  return {
                                    ...app,
                                    taskerInfo: null,
                                    isRated: ratedTaskerIds.has(app.taskerId),
                                    review: reviewData,
                                  };
                                }
                              })
                            );

                            setTaskersToRate(taskersList);
                            ratingsCheckedRef.current = true;
                          } else {
                            setAllRated(true);
                            setUnratedCount(0);
                            setTaskersToRate([]);
                            ratingsCheckedRef.current = true;
                          }
                        } catch (error) {
                          console.error("Fetch taskers error:", error);
                        } finally {
                          setCheckingRatings(false);
                        }
                      }
                    }}
                    className="w-full mb-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm sm:text-base"
                  >
                    Rate Taskers
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleViewMatches}
                      className="w-full mb-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm sm:text-base"
                    >
                      View Matched Taskers
                    </button>
                    <button
                      onClick={handleViewApplications}
                      className="w-full mb-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm sm:text-base"
                    >
                      View Applications
                    </button>
                    <button
                      onClick={() => setShowStartTaskModal(true)}
                      disabled={hiredCount === 0 || job.status !== "open"}
                      className={`w-full mb-3 px-4 py-2 rounded-lg transition text-sm sm:text-base font-medium ${
                        hiredCount > 0 && job.status === "open"
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "bg-gray-400 text-gray-600 cursor-not-allowed"
                      }`}
                    >
                      Start Task
                    </button>
                    <div className="text-sm text-gray-600 mb-2">
                      Applications: <span className="font-semibold text-gray-900">{applications.length}</span>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Actions (Tasker - when employed) */}
            {isTasker && job && job.status === "in_progress" && (
              <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Actions</h3>
                {applications.some((app: any) => 
                  app.taskerId === user?.userId && app.status?.toLowerCase() === "accepted"
                ) && (
                  <button
                    onClick={() => setShowResignModal(true)}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm sm:text-base"
                  >
                    Resign
                  </button>
                )}
              </div>
            )}

            {/* Actions (Tasker - when finished) */}
            {canRateCustomer && (
              <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Actions</h3>
                <button
                  onClick={async () => {
                    const hasReview = await fetchCustomerReviewStatus();
                    setRateCustomerTab(hasReview ? "rated" : "to-rate");
                    setShowRateCustomerModal(true);
                  }}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm sm:text-base"
                >
                  Rate Customer
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Matches Modal */}
        {showMatches && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/20 backdrop-blur-md"
              onClick={() => setShowMatches(false)}
              role="presentation"
            />
            <div className="relative bg-white rounded-lg p-4 sm:p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Matched Taskers</h2>
                <button
                  onClick={() => setShowMatches(false)}
                  className="text-gray-400 hover:text-gray-600 transition"
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
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {match.tasker?.firstName} {match.tasker?.lastName}
                          </h3>
                          <p className="text-sm text-gray-600">{match.tasker?.expertise}</p>
                        </div>
                        <span className="px-3 py-1 bg-blue-200 text-blue-800 rounded-full text-sm font-medium">
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
                      <div className="flex items-center gap-3 mt-3">
                        <Link
                          to={`/users/${match.tasker?.userId}`}
                          className="text-blue-700 hover:underline text-sm"
                        >
                          View Profile →
                        </Link>
                        {isOwner && job && job.status === "open" && (
                          <>
                            {match.application ? (
                              match.application.status === 'accepted' ? (
                                <span className="ml-auto px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium">
                                  Hired
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleHireTasker(match.tasker?.userId, match.application?.applicationId)}
                                  className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                                >
                                  Hire
                                </button>
                              )
                            ) : (
                              <span className="ml-auto px-4 py-2 bg-gray-100 text-gray-500 rounded-lg text-sm font-medium">
                                Not Applied
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Applications Modal */}
        {showApplicationsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/30 backdrop-blur-md"
              onClick={() => {
                setShowApplicationsModal(false);
                setViewingApplication(null);
                setViewingTasker(null);
              }}
              role="presentation"
            />
            <div className="relative bg-white rounded-lg p-4 sm:p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Job Applications</h2>
                <button
                  onClick={() => {
                    setShowApplicationsModal(false);
                    setViewingApplication(null);
                    setViewingTasker(null);
                    setViewingMatchPercentage(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>
              {loadingApplications ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Loading applications...</p>
                </div>
              ) : applicationsWithTaskers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No applications yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {applicationsWithTaskers.map((app: any) => (
                    <div
                      key={app.applicationId}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          {app.taskerInfo ? (
                            <>
                              <h3 className="font-semibold text-gray-900 text-lg">
                                {app.taskerInfo.firstName} {app.taskerInfo.lastName}
                              </h3>
                              {app.taskerInfo.expertise && (
                                <p className="text-sm text-gray-600 mt-1">
                                  {Array.isArray(app.taskerInfo.expertise) 
                                    ? app.taskerInfo.expertise.join(", ")
                                    : app.taskerInfo.expertise}
                                </p>
                              )}
                            </>
                          ) : (
                            <h3 className="font-semibold text-gray-900">
                              Tasker ID: {app.taskerId}
                            </h3>
                          )}
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          app.status === "accepted" ? "bg-green-200 text-green-800" :
                          app.status === "rejected" ? "bg-red-200 text-red-800" :
                          app.status === "withdrawn" ? "bg-gray-100 text-gray-800" :
                          "bg-yellow-200 text-yellow-800"
                        }`}>
                          {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                        </span>
                      </div>
                      {app.proposedBudget && (
                        <div className="mb-3">
                          <p className="text-sm text-gray-600">Proposed Budget:</p>
                          <p className="font-semibold text-gray-900">₱{app.proposedBudget.toLocaleString()}</p>
                        </div>
                      )}
                      {app.coverLetter && (
                        <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                          {app.coverLetter}
                        </p>
                      )}
                      <div className="flex items-center gap-3">
                        {app.taskerInfo && (
                          <Link
                            to={`/users/${app.taskerId}`}
                            className="text-blue-700 hover:underline text-sm"
                          >
                            View Profile →
                          </Link>
                        )}
                        <button
                          onClick={() => handleViewApplicationDetails(app)}
                          className="ml-auto flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                        >
                          <FiEye className="w-4 h-4" />
                          View Application
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Application Details Modal */}
        {viewingApplication && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/30 backdrop-blur-md"
              onClick={() => {
                setViewingApplication(null);
                setViewingTasker(null);
                setViewingMatchPercentage(null);
              }}
              role="presentation"
            />
            <div className="relative bg-white rounded-lg p-4 sm:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Application Details</h2>
                <button
                  onClick={() => {
                    setViewingApplication(null);
                    setViewingTasker(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              {/* Tasker Info */}
              {viewingTasker && (
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {viewingTasker.firstName} {viewingTasker.lastName}
                    </h3>
                    {viewingMatchPercentage !== null && (
                      <span className="px-3 py-1 bg-blue-200 text-blue-800 rounded-full text-sm font-medium">
                        {viewingMatchPercentage}% Match
                      </span>
                    )}
                  </div>
                  {viewingTasker.expertise && (
                    <div className="mb-3">
                      <span className="text-sm font-medium text-gray-700">Expertise: </span>
                      <span className="text-sm text-gray-600">
                        {Array.isArray(viewingTasker.expertise) 
                          ? viewingTasker.expertise.join(", ")
                          : viewingTasker.expertise}
                      </span>
                    </div>
                  )}
                  {viewingTasker.skills && Array.isArray(viewingTasker.skills) && viewingTasker.skills.length > 0 ? (
                    <div className="mb-3">
                      <span className="text-sm font-medium text-gray-700">Skills: </span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {viewingTasker.skills.map((skill: string, idx: number) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-blue-200 text-blue-800 rounded text-xs"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="mb-3">
                      <span className="text-sm font-medium text-gray-700">Skills: </span>
                      <span className="text-sm text-gray-500 italic">No skills listed</span>
                    </div>
                  )}
                  <Link
                    to={`/users/${viewingApplication.taskerId}`}
                    className="inline-block mt-2 text-blue-700 hover:underline text-sm"
                  >
                    View Full Profile →
                  </Link>
                </div>
              )}

              {/* Application Info */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Application ID</label>
                  <p className="text-gray-900">#{viewingApplication.applicationId}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    viewingApplication.status === "accepted" ? "bg-green-200 text-green-800" :
                    viewingApplication.status === "rejected" ? "bg-red-200 text-red-800" :
                    viewingApplication.status === "withdrawn" ? "bg-gray-100 text-gray-800" :
                    "bg-yellow-200 text-yellow-800"
                  }`}>
                    {viewingApplication.status.charAt(0).toUpperCase() + viewingApplication.status.slice(1)}
                  </span>
                </div>

                {viewingApplication.proposedBudget && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Proposed Budget</label>
                    <p className="text-gray-900 font-semibold">₱{viewingApplication.proposedBudget.toLocaleString()}</p>
                  </div>
                )}

                {viewingApplication.coverLetter && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cover Letter</label>
                    <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">
                      {viewingApplication.coverLetter}
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Applied On</label>
                  <p className="text-gray-900">
                    {new Date(viewingApplication.createdAt).toLocaleString()}
                  </p>
                </div>

                {viewingApplication.status?.toLowerCase() === "accepted" && viewingApplication.updatedAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hired On</label>
                    <p className="text-gray-900">
                      {new Date(viewingApplication.updatedAt).toLocaleString()}
                    </p>
                  </div>
                )}

                {viewingApplication.status?.toLowerCase() === "rejected" && viewingApplication.updatedAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rejected On</label>
                    <p className="text-gray-900">
                      {new Date(viewingApplication.updatedAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                {isOwner && job && job.status === "open" && viewingApplication.status === "pending" && (
                  <div className="flex gap-3 mb-3">
                    <button
                      onClick={() => handleAcceptApplication(viewingApplication.applicationId)}
                      disabled={processingApplication}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processingApplication ? "Processing..." : "Hire"}
                    </button>
                    <button
                      onClick={() => handleRejectApplication(viewingApplication.applicationId)}
                      disabled={processingApplication}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processingApplication ? "Processing..." : "Reject"}
                    </button>
                  </div>
                )}
                <div className="flex gap-3">
                  {viewingTasker && (
                    <Link
                      to={`/users/${viewingApplication.taskerId}`}
                      className="flex-1 text-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
                    >
                      View Tasker Profile
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      setViewingApplication(null);
                      setViewingTasker(null);
                      setViewingMatchPercentage(null);
                    }}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition text-sm font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Start Task Confirmation Modal */}
        {showStartTaskModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/30 backdrop-blur-md"
              onClick={() => setShowStartTaskModal(false)}
              role="presentation"
            />
            <div className="relative bg-white rounded-lg p-4 sm:p-6 max-w-md w-full shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Start Task</h2>
                <button
                  onClick={() => setShowStartTaskModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition"
                  disabled={startingTask}
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>
              <div className="mb-6">
                <p className="text-gray-700 mb-2">
                  Are you sure you want to start this task? This will change the job status to "Ongoing".
                </p>
                <p className="text-sm text-gray-500">
                  This action will notify the hired tasker(s) and mark the job as in progress.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowStartTaskModal(false)}
                  disabled={startingTask}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStartTask}
                  disabled={startingTask}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {startingTask ? "Starting..." : "Confirm Start Task"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Taskers Modal */}
        {showTaskersModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/30 backdrop-blur-md"
              onClick={() => setShowTaskersModal(false)}
              role="presentation"
            />
            <div className="relative bg-white rounded-lg p-4 sm:p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Taskers</h2>
                <button
                  onClick={() => setShowTaskersModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition"
                  disabled={loadingTaskers}
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              {loadingTaskers ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Loading taskers...</p>
                </div>
              ) : (
                <>
                  {/* Tabs */}
                  <div className="flex border-b border-gray-200 mb-4">
                    <button
                      onClick={() => setTaskersTab("active")}
                      className={`flex-1 px-4 py-2 text-sm font-medium transition ${
                        taskersTab === "active"
                          ? "text-blue-600 border-b-2 border-blue-600"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      Active ({activeTaskers.length})
                    </button>
                    <button
                      onClick={() => setTaskersTab("fired")}
                      className={`flex-1 px-4 py-2 text-sm font-medium transition ${
                        taskersTab === "fired"
                          ? "text-blue-600 border-b-2 border-blue-600"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      Fired ({firedTaskers.length})
                    </button>
                    <button
                      onClick={() => setTaskersTab("resigned")}
                      className={`flex-1 px-4 py-2 text-sm font-medium transition ${
                        taskersTab === "resigned"
                          ? "text-blue-600 border-b-2 border-blue-600"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      Resigned ({resignedTaskers.length})
                    </button>
                  </div>

                  {/* Tab Content */}
                  {taskersTab === "active" && (
                    <div>
                      {activeTaskers.length === 0 ? (
                        <p className="text-gray-500 text-sm text-center py-8">No active taskers</p>
                      ) : (
                        <div className="space-y-3">
                          {activeTaskers.map((app: any) => (
                            <div
                              key={app.applicationId}
                              className="border border-green-200 rounded-lg p-4 bg-green-50"
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  {app.taskerInfo ? (
                                    <>
                                      <h4 className="font-semibold text-gray-900">
                                        {app.taskerInfo.firstName} {app.taskerInfo.lastName}
                                      </h4>
                                      <p className="text-sm text-gray-600 mt-1">
                                        ID: {app.taskerId}
                                      </p>
                                    </>
                                  ) : (
                                    <h4 className="font-semibold text-gray-900">
                                      Tasker ID: {app.taskerId}
                                    </h4>
                                  )}
                                </div>
                                <span className="px-3 py-1 bg-green-200 text-green-800 rounded-full text-sm font-medium">
                                  Active
                                </span>
                              </div>
                              <div className="flex items-center gap-3 mt-3">
                                {app.taskerInfo && (
                                  <Link
                                    to={`/users/${app.taskerId}`}
                                    className="text-blue-700 hover:underline text-sm"
                                  >
                                    View Profile →
                                  </Link>
                                )}
                                <button
                                  onClick={() => {
                                    setTerminatingApplication(app);
                                    setShowTerminateModal(true);
                                  }}
                                  className="ml-auto px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium"
                                >
                                  Terminate
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {taskersTab === "fired" && (
                    <div>
                      {firedTaskers.length === 0 ? (
                        <p className="text-gray-500 text-sm text-center py-8">No fired taskers</p>
                      ) : (
                        <div className="space-y-3">
                          {firedTaskers.map((app: any) => (
                            <div
                              key={app.applicationId}
                              className="border border-red-200 rounded-lg p-4 bg-red-50"
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  {app.taskerInfo ? (
                                    <>
                                      <h4 className="font-semibold text-gray-900">
                                        {app.taskerInfo.firstName} {app.taskerInfo.lastName}
                                      </h4>
                                      <p className="text-sm text-gray-600 mt-1">
                                        ID: {app.taskerId}
                                      </p>
                                    </>
                                  ) : (
                                    <h4 className="font-semibold text-gray-900">
                                      Tasker ID: {app.taskerId}
                                    </h4>
                                  )}
                                </div>
                                <span className="px-3 py-1 bg-red-200 text-red-800 rounded-full text-sm font-medium">
                                  Fired
                                </span>
                              </div>
                              <div className="flex items-center gap-3 mt-3">
                                {app.taskerInfo && (
                                  <Link
                                    to={`/users/${app.taskerId}`}
                                    className="text-blue-700 hover:underline text-sm"
                                  >
                                    View Profile →
                                  </Link>
                                )}
                                <button
                                  onClick={() => handleViewTerminationDetails(app)}
                                  className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                                >
                                  Termination Details
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {taskersTab === "resigned" && (
                    <div>
                      {resignedTaskers.length === 0 ? (
                        <p className="text-gray-500 text-sm text-center py-8">No resigned taskers</p>
                      ) : (
                        <div className="space-y-3">
                          {resignedTaskers.map((app: any) => (
                            <div
                              key={app.applicationId}
                              className="border border-orange-200 rounded-lg p-4 bg-orange-50"
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  {app.taskerInfo ? (
                                    <>
                                      <h4 className="font-semibold text-gray-900">
                                        {app.taskerInfo.firstName} {app.taskerInfo.lastName}
                                      </h4>
                                      <p className="text-sm text-gray-600 mt-1">
                                        ID: {app.taskerId}
                                      </p>
                                    </>
                                  ) : (
                                    <h4 className="font-semibold text-gray-900">
                                      Tasker ID: {app.taskerId}
                                    </h4>
                                  )}
                                </div>
                                <span className="px-3 py-1 bg-orange-200 text-orange-800 rounded-full text-sm font-medium">
                                  Resigned
                                </span>
                              </div>
                              <div className="flex items-center gap-3 mt-3">
                                {app.taskerInfo && (
                                  <Link
                                    to={`/users/${app.taskerId}`}
                                    className="text-blue-700 hover:underline text-sm"
                                  >
                                    View Profile →
                                  </Link>
                                )}
                                <button
                                  onClick={() => handleViewResignationDetails(app)}
                                  className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                                >
                                  Resignation Details
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Terminate Modal */}
        {showTerminateModal && terminatingApplication && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/30 backdrop-blur-md"
              onClick={() => {
                if (!terminating) {
                  setShowTerminateModal(false);
                  setTerminatingApplication(null);
                  setTerminateReason("");
                }
              }}
              role="presentation"
            />
            <div className="relative bg-white rounded-lg p-4 sm:p-6 max-w-md w-full shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Terminate Tasker</h2>
                <button
                  onClick={() => {
                    if (!terminating) {
                      setShowTerminateModal(false);
                      setTerminatingApplication(null);
                      setTerminateReason("");
                    }
                  }}
                  className="text-gray-400 hover:text-gray-600 transition"
                  disabled={terminating}
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>
              <div className="mb-4">
                {terminatingApplication.taskerInfo && (
                  <p className="text-sm text-gray-700 mb-2">
                    Terminating: <span className="font-semibold">{terminatingApplication.taskerInfo.firstName} {terminatingApplication.taskerInfo.lastName}</span>
                  </p>
                )}
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Termination <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={terminateReason}
                  onChange={(e) => setTerminateReason(e.target.value)}
                  placeholder="Please provide a reason for terminating this tasker..."
                  rows={5}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  disabled={terminating}
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  This reason will be visible to the tasker.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (!terminating) {
                      setShowTerminateModal(false);
                      setTerminatingApplication(null);
                      setTerminateReason("");
                    }
                  }}
                  disabled={terminating}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTerminate}
                  disabled={terminating || !terminateReason.trim()}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {terminating ? "Terminating..." : "Confirm Termination"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Termination Details Modal */}
        {showTerminationDetailsModal && viewingTerminationDetails && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/30 backdrop-blur-md"
              onClick={() => {
                setShowTerminationDetailsModal(false);
                setViewingTerminationDetails(null);
              }}
              role="presentation"
            />
            <div className="relative bg-white rounded-lg p-4 sm:p-6 max-w-md w-full shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Termination Details</h2>
                <button
                  onClick={() => {
                    setShowTerminationDetailsModal(false);
                    setViewingTerminationDetails(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-4">
                {viewingTerminationDetails.taskerInfo && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tasker</label>
                    <p className="text-gray-900">
                      {viewingTerminationDetails.taskerInfo.firstName} {viewingTerminationDetails.taskerInfo.lastName}
                    </p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Termination</label>
                  <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">
                    {viewingTerminationDetails.coverLetter || "No reason provided"}
                  </p>
                </div>
                {viewingTerminationDetails.updatedAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Terminated On</label>
                    <p className="text-gray-900">
                      {new Date(viewingTerminationDetails.updatedAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
              <div className="mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowTerminationDetailsModal(false);
                    setViewingTerminationDetails(null);
                  }}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Resignation Details Modal */}
        {showResignationDetailsModal && viewingResignationDetails && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/30 backdrop-blur-md"
              onClick={() => {
                setShowResignationDetailsModal(false);
                setViewingResignationDetails(null);
              }}
              role="presentation"
            />
            <div className="relative bg-white rounded-lg p-4 sm:p-6 max-w-md w-full shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Resignation Details</h2>
                <button
                  onClick={() => {
                    setShowResignationDetailsModal(false);
                    setViewingResignationDetails(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-4">
                {viewingResignationDetails.taskerInfo && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tasker</label>
                    <p className="text-gray-900">
                      {viewingResignationDetails.taskerInfo.firstName} {viewingResignationDetails.taskerInfo.lastName}
                    </p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Resignation</label>
                  <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">
                    {viewingResignationDetails.coverLetter || "No reason provided"}
                  </p>
                </div>
                {viewingResignationDetails.updatedAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Resigned On</label>
                    <p className="text-gray-900">
                      {new Date(viewingResignationDetails.updatedAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
              <div className="mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowResignationDetailsModal(false);
                    setViewingResignationDetails(null);
                  }}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Resign Modal */}
        {showResignModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/30 backdrop-blur-md"
              onClick={() => {
                if (!resigning) {
                  setShowResignModal(false);
                  setResignReason("");
                }
              }}
              role="presentation"
            />
            <div className="relative bg-white rounded-lg p-4 sm:p-6 max-w-md w-full shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Resign from Job</h2>
                <button
                  onClick={() => {
                    if (!resigning) {
                      setShowResignModal(false);
                      setResignReason("");
                    }
                  }}
                  className="text-gray-400 hover:text-gray-600 transition"
                  disabled={resigning}
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Resignation <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={resignReason}
                  onChange={(e) => setResignReason(e.target.value)}
                  placeholder="Please provide a reason for resigning from this job..."
                  rows={5}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  disabled={resigning}
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  This reason will be visible to the job owner.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (!resigning) {
                      setShowResignModal(false);
                      setResignReason("");
                    }
                  }}
                  disabled={resigning}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResign}
                  disabled={resigning || !resignReason.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resigning ? "Resigning..." : "Confirm Resign"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Rate Taskers Modal */}
        {showRateTaskersModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/30 backdrop-blur-md"
              onClick={() => setShowRateTaskersModal(false)}
              role="presentation"
            />
            <div className="relative bg-white rounded-lg p-4 sm:p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Rate Taskers</h2>
                <button
                  onClick={() => setShowRateTaskersModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>
              {checkingRatings || taskersToRate.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Loading taskers...</p>
                </div>
              ) : (
                <>
                  {/* Tabs */}
                  <div className="flex border-b border-gray-200 mb-4">
                    <button
                      onClick={() => setRateTaskersTab("to-rate")}
                      className={`flex-1 px-4 py-2 text-sm font-medium transition ${
                        rateTaskersTab === "to-rate"
                          ? "text-blue-600 border-b-2 border-blue-600"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      To Rate ({taskersToRate.filter((t: any) => !t.isRated).length})
                    </button>
                    <button
                      onClick={() => setRateTaskersTab("rated")}
                      className={`flex-1 px-4 py-2 text-sm font-medium transition ${
                        rateTaskersTab === "rated"
                          ? "text-blue-600 border-b-2 border-blue-600"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      Rated ({taskersToRate.filter((t: any) => t.isRated).length})
                    </button>
                  </div>

                  {/* Tab Content */}
                  {rateTaskersTab === "to-rate" ? (
                    <div>
                      {taskersToRate.filter((t: any) => !t.isRated).length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-gray-500">No taskers to rate</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {taskersToRate
                            .filter((t: any) => !t.isRated)
                            .map((tasker: any) => (
                              <div
                                key={tasker.applicationId}
                                className="border border-gray-200 rounded-lg p-4 bg-white"
                              >
                                <div className="flex justify-between items-center">
                                  <div>
                                    {tasker.taskerInfo ? (
                                      <>
                                        <h4 className="font-semibold text-gray-900">
                                          {tasker.taskerInfo.firstName} {tasker.taskerInfo.lastName}
                                        </h4>
                                        <p className="text-sm text-gray-600 mt-1">
                                          ID: {tasker.taskerId}
                                        </p>
                                      </>
                                    ) : (
                                      <>
                                        <h4 className="font-semibold text-gray-900">
                                          Tasker ID: {tasker.taskerId}
                                        </h4>
                                      </>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => {
                                      setRatingTasker(tasker);
                                      setShowRatingModal(true);
                                    }}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                                  >
                                    Rate
                                  </button>
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      {taskersToRate.filter((t: any) => t.isRated).length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-gray-500">No rated taskers</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {taskersToRate
                            .filter((t: any) => t.isRated)
                            .map((tasker: any) => (
                              <div
                                key={tasker.applicationId}
                                className="border border-green-200 rounded-lg p-4 bg-green-50"
                              >
                                <div className="flex justify-between items-center">
                                  <div>
                                    {tasker.taskerInfo ? (
                                      <>
                                        <h4 className="font-semibold text-gray-900">
                                          {tasker.taskerInfo.firstName} {tasker.taskerInfo.lastName}
                                        </h4>
                                        <p className="text-sm text-gray-600 mt-1">
                                          ID: {tasker.taskerId}
                                        </p>
                                      </>
                                    ) : (
                                      <>
                                        <h4 className="font-semibold text-gray-900">
                                          Tasker ID: {tasker.taskerId}
                                        </h4>
                                      </>
                                    )}
                                    {typeof tasker.review?.rating === "number" && (
                                      <div className="mt-2 flex items-center gap-1 text-sm text-gray-700">
                                        <FiStar className="text-yellow-400" />
                                        <span className="font-semibold">{tasker.review.rating}</span>
                                        <span className="text-gray-500">/ 5</span>
                                      </div>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => {
                                      setEditingReview({
                                        reviewId: tasker.review?.reviewId,
                                        rating: tasker.review?.rating,
                                        comment: tasker.review?.comment,
                                        edited: tasker.review?.edited || false,
                                      });
                                      setShowEditRatingModal(true);
                                    }}
                                    disabled={tasker.review?.edited}
                                    className={`px-4 py-2 rounded-lg transition text-sm font-medium ${
                                      tasker.review?.edited
                                        ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                                        : "bg-blue-600 text-white hover:bg-blue-700"
                                    }`}
                                  >
                                    {tasker.review?.edited ? "Already Edited" : "Edit Rating"}
                                  </button>
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Rate Customer Modal */}
        {showRateCustomerModal && job && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/30 backdrop-blur-md"
              onClick={() => setShowRateCustomerModal(false)}
              role="presentation"
            />
            <div className="relative bg-white rounded-lg p-4 sm:p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Rate Customer</h2>
                <button
                  onClick={() => setShowRateCustomerModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>
              {checkingCustomerRating ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Loading customer...</p>
                </div>
              ) : (
                <>
                  <div className="flex border-b border-gray-200 mb-4">
                    <button
                      onClick={() => setRateCustomerTab("to-rate")}
                      className={`flex-1 px-4 py-2 text-sm font-medium transition ${
                        rateCustomerTab === "to-rate"
                          ? "text-blue-600 border-b-2 border-blue-600"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      To Rate ({customersToRateCount})
                    </button>
                    <button
                      onClick={() => setRateCustomerTab("rated")}
                      className={`flex-1 px-4 py-2 text-sm font-medium transition ${
                        rateCustomerTab === "rated"
                          ? "text-blue-600 border-b-2 border-blue-600"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      Rated ({customersRatedCount})
                    </button>
                  </div>

                  {rateCustomerTab === "to-rate" ? (
                    customersToRateCount === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500">Customer already rated</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="border border-gray-200 rounded-lg p-4 bg-white">
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                {posterName || "Customer"}
                              </h4>
                              <p className="text-sm text-gray-600 mt-1">ID: {job.customerId}</p>
                            </div>
                            <button
                              onClick={() => {
                                setShowCustomerRatingModal(true);
                                setShowRateCustomerModal(false);
                              }}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                            >
                              Rate
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  ) : customersRatedCount === 0 || !customerReview ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No rated customers</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {posterName || "Customer"}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">ID: {job.customerId}</p>
                            {typeof customerReview?.rating === "number" && (
                              <div className="mt-2 flex items-center gap-1 text-sm text-gray-700">
                                <FiStar className="text-yellow-400" />
                                <span className="font-semibold">{customerReview.rating}</span>
                                <span className="text-gray-500">/ 5</span>
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              setEditingCustomerReview({
                                reviewId: customerReview?.reviewId,
                                rating: customerReview?.rating,
                                comment: customerReview?.comment,
                                edited: customerReview?.edited || false,
                              });
                              setShowEditCustomerRatingModal(true);
                              setShowRateCustomerModal(false);
                            }}
                            disabled={customerReview?.edited}
                            className={`px-4 py-2 rounded-lg text-sm font-medium ${
                              customerReview?.edited
                                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                : "bg-blue-600 text-white hover:bg-blue-700"
                            }`}
                          >
                            {customerReview?.edited ? "Already Edited" : "Edit Rating"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Rating Modal */}
        {showRatingModal && ratingTasker && (
          <CreateReviewModal
            isOpen={showRatingModal}
            onClose={() => {
              setShowRatingModal(false);
              setRatingTasker(null);
            }}
            onSuccess={async () => {
              // Reset the ref to allow re-checking after rating
              ratingsCheckedRef.current = false;
              
              // Refresh ratings check
              if (job) {
                try {
                  setCheckingRatings(true);
                  const acceptedApps = applications.filter(
                    (app: any) => app.status?.toLowerCase() === "accepted"
                  );

                  if (acceptedApps.length > 0) {
                    const reviewsResponse = await getJobReviews(job.jobId);
                    let reviewsData: any[] = [];
                    
                    if (reviewsResponse?.response?.reviews) {
                      reviewsData = Array.isArray(reviewsResponse.response.reviews) ? reviewsResponse.response.reviews : [];
                    } else if (reviewsResponse?.data?.response?.reviews) {
                      reviewsData = Array.isArray(reviewsResponse.data.response.reviews) ? reviewsResponse.data.response.reviews : [];
                    } else if (Array.isArray(reviewsResponse?.response)) {
                      reviewsData = reviewsResponse.response;
                    } else if (Array.isArray(reviewsResponse?.data?.response)) {
                      reviewsData = reviewsResponse.data.response;
                    } else if (Array.isArray(reviewsResponse?.data)) {
                      reviewsData = reviewsResponse.data;
                    }

                    const reviewMap = new Map();
                    reviewsData.forEach((review: any) => {
                      if (review?.taskerId) {
                        reviewMap.set(review.taskerId, {
                          reviewId: review.reviewId,
                          rating: review.rating,
                          comment: review.comment,
                          edited: review.edited || false,
                        });
                      }
                    });

                    const ratedTaskerIds = new Set(reviewsData.map((r: any) => r?.taskerId).filter(Boolean));
                    const unratedApps = acceptedApps.filter((app: any) => !ratedTaskerIds.has(app.taskerId));

                    setUnratedCount(unratedApps.length);
                    setAllRated(unratedApps.length === 0);

                    const taskersList = await Promise.all(
                      acceptedApps.map(async (app: any) => {
                        try {
                          const token = getStoredAuthToken();
                          const taskerResponse = await GET(`/users/${app.taskerId}/public`, "", token);
                          const taskerData = taskerResponse?.response || taskerResponse?.data || taskerResponse;
                          const reviewData = reviewMap.get(app.taskerId) || null;
                          return {
                            ...app,
                            taskerInfo: taskerData || null,
                            isRated: ratedTaskerIds.has(app.taskerId),
                            review: reviewData,
                          };
                        } catch (err) {
                          const reviewData = reviewMap.get(app.taskerId) || null;
                          return {
                            ...app,
                            taskerInfo: null,
                            isRated: ratedTaskerIds.has(app.taskerId),
                            review: reviewData,
                          };
                        }
                      })
                    );

                    setTaskersToRate(taskersList);
                    ratingsCheckedRef.current = true;
                  }
                } catch (error) {
                  console.error("Refresh ratings error:", error);
                  ratingsCheckedRef.current = false;
                } finally {
                  setCheckingRatings(false);
                }
              }
              setShowRatingModal(false);
              setRatingTasker(null);
            }}
            taskerId={ratingTasker.taskerId}
            jobId={job?.jobId}
          />
        )}

        {/* Edit Rating Modal */}
        {showEditRatingModal && editingReview && (
          <EditReviewModal
            isOpen={showEditRatingModal}
            onClose={() => {
              setShowEditRatingModal(false);
              setEditingReview(null);
            }}
            onSuccess={async () => {
              // Reset the ref to allow re-checking after editing
              ratingsCheckedRef.current = false;
              
              // Refresh ratings check
              if (job) {
                try {
                  setCheckingRatings(true);
                  const acceptedApps = applications.filter(
                    (app: any) => app.status?.toLowerCase() === "accepted"
                  );

                  if (acceptedApps.length > 0) {
                    const reviewsResponse = await getJobReviews(job.jobId);
                    console.log("Reviews response (edit onSuccess):", reviewsResponse);
                    let reviewsData: any[] = [];
                    
                    // GET returns response.data which is { status, response: { reviews: [...] }, message }
                    if (reviewsResponse?.response?.reviews && Array.isArray(reviewsResponse.response.reviews)) {
                      reviewsData = reviewsResponse.response.reviews;
                    } else if (reviewsResponse?.data?.response?.reviews && Array.isArray(reviewsResponse.data.response.reviews)) {
                      reviewsData = reviewsResponse.data.response.reviews;
                    } else if (reviewsResponse?.response && Array.isArray(reviewsResponse.response)) {
                      reviewsData = reviewsResponse.response;
                    } else if (reviewsResponse?.data?.response && Array.isArray(reviewsResponse.data.response)) {
                      reviewsData = reviewsResponse.data.response;
                    } else if (Array.isArray(reviewsResponse?.data)) {
                      reviewsData = reviewsResponse.data;
                    }
                    
                    console.log("Extracted reviews data (edit onSuccess):", reviewsData);

                    const ratedTaskerIds = new Set(
                      reviewsData.map((review: any) => review.taskerId)
                    );

                    const reviewMap = new Map();
                    reviewsData.forEach((review: any) => {
                      reviewMap.set(review.taskerId, {
                        reviewId: review.reviewId,
                        rating: review.rating,
                        comment: review.comment,
                        edited: review.edited || false,
                      });
                    });

                    const unratedApps = acceptedApps.filter(
                      (app: any) => !ratedTaskerIds.has(app.taskerId)
                    );

                    setUnratedCount(unratedApps.length);
                    setAllRated(unratedApps.length === 0);

                    const taskersList = await Promise.all(
                      acceptedApps.map(async (app: any) => {
                        try {
                          const token = getStoredAuthToken();
                          const taskerResponse = await GET(`/users/${app.taskerId}/public`, "", token);
                          const taskerData = taskerResponse?.response || taskerResponse?.data || taskerResponse;
                          const reviewData = reviewMap.get(app.taskerId);
                          return {
                            ...app,
                            taskerInfo: taskerData || null,
                            isRated: ratedTaskerIds.has(app.taskerId),
                            review: reviewData || null,
                          };
                        } catch (err) {
                          console.error(`Failed to fetch tasker ${app.taskerId}:`, err);
                          const reviewData = reviewMap.get(app.taskerId);
                          return {
                            ...app,
                            taskerInfo: null,
                            isRated: ratedTaskerIds.has(app.taskerId),
                            review: reviewData || null,
                          };
                        }
                      })
                    );

                    setTaskersToRate(taskersList);
                    ratingsCheckedRef.current = true;
                  }
                } catch (error) {
                  console.error("Refresh ratings error:", error);
                  ratingsCheckedRef.current = false;
                } finally {
                  setCheckingRatings(false);
                }
              }
              setShowEditRatingModal(false);
              setEditingReview(null);
            }}
            reviewId={editingReview.reviewId}
            initialRating={editingReview.rating}
            initialComment={editingReview.comment}
            edited={editingReview.edited}
          />
        )}

        {showCustomerRatingModal && job && (
          <CreateReviewModal
            isOpen={showCustomerRatingModal}
            onClose={() => setShowCustomerRatingModal(false)}
            onSuccess={async () => {
              await fetchCustomerReviewStatus();
              setRateCustomerTab("rated");
            }}
            taskerId={job.customerId}
            jobId={job.jobId}
          />
        )}

        {showEditCustomerRatingModal && editingCustomerReview && (
          <EditReviewModal
            isOpen={showEditCustomerRatingModal}
            onClose={() => {
              setShowEditCustomerRatingModal(false);
              setEditingCustomerReview(null);
            }}
            onSuccess={async () => {
              await fetchCustomerReviewStatus();
            }}
            reviewId={editingCustomerReview.reviewId}
            initialRating={editingCustomerReview.rating}
            initialComment={editingCustomerReview.comment}
            edited={editingCustomerReview.edited}
          />
        )}
      </div>
    </div>
  );
};

export default JobDetails;

