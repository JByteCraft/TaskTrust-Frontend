import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FiSearch, FiFilter, FiMapPin, FiClock, FiBriefcase, FiFileText, FiEye, FiX } from "react-icons/fi";
import { getJobs, getMyJobs, getMatchPercentage } from "../../lib/api/jobs.api";
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
  requiredExpertise?: string;
  status: string;
  applicationsCount: number;
  deadline?: string;
  jobType?: string;
  estimatedHours?: number;
  customerId: number;
  createdAt: string;
  matchPercentage?: number; // Match percentage for taskers
  employmentStatus?: string; // Application status for employed jobs (accepted, rejected, withdrawn)
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
  const [browseBudgetFilter, setBrowseBudgetFilter] = useState("all");
  const [browseLocationFilter, setBrowseLocationFilter] = useState("");
  const [browseDateFilter, setBrowseDateFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<"browse" | "my-jobs" | "applications" | "employed">("browse");
  const [viewingApplication, setViewingApplication] = useState<any>(null);
  const [viewingJob, setViewingJob] = useState<Job | null>(null);
  const [currentMatchPercentage, setCurrentMatchPercentage] = useState<number | null>(null);
  const [applicationSearchQuery, setApplicationSearchQuery] = useState("");
  const [applicationStatusFilter, setApplicationStatusFilter] = useState("all");
  const [applicationDateFilter, setApplicationDateFilter] = useState("all");
  const [applicationBudgetFilter, setApplicationBudgetFilter] = useState("all");
  const [applicationLocationFilter, setApplicationLocationFilter] = useState("");
  const [showApplicationFilters, setShowApplicationFilters] = useState(false);
  const [myJobsSearchQuery, setMyJobsSearchQuery] = useState("");
  const [myJobsStatusFilter, setMyJobsStatusFilter] = useState("all");
  const [myJobsBudgetFilter, setMyJobsBudgetFilter] = useState("all");
  const [myJobsLocationFilter, setMyJobsLocationFilter] = useState("");
  const [myJobsDateFilter, setMyJobsDateFilter] = useState("all");
  const [showMyJobsFilters, setShowMyJobsFilters] = useState(false);
  const [employedSearchQuery, setEmployedSearchQuery] = useState("");
  const [employedTaskStatusFilter, setEmployedTaskStatusFilter] = useState("all");
  const [employedEmploymentStatusFilter, setEmployedEmploymentStatusFilter] = useState("all");
  const [employedBudgetFilter, setEmployedBudgetFilter] = useState("all");
  const [employedLocationFilter, setEmployedLocationFilter] = useState("");
  const [employedDateFilter, setEmployedDateFilter] = useState("all");
  const [showEmployedFilters, setShowEmployedFilters] = useState(false);

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

      // Fetch job details for each application to ensure we have location data
      const { getJob } = await import("../../lib/api/jobs.api");
      const jobsToAdd: Job[] = [];
      for (const app of appsData) {
        try {
          // Fetch job details to ensure we have complete data including location
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
            jobsToAdd.push({
              jobId: jobData.jobId,
              title: jobData.title,
              description: jobData.description || "",
              budget: jobData.budget,
              city: jobData.city,
              province: jobData.province,
              requiredSkills: jobData.requiredSkills,
              requiredExpertise: jobData.requiredExpertise,
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

      // Merge fetched jobs into the jobs array (avoid duplicates)
      if (jobsToAdd.length > 0) {
        setJobs((prevJobs) => {
          const newJobs = [...prevJobs];
          jobsToAdd.forEach((job) => {
            if (!newJobs.find((j) => j.jobId === job.jobId)) {
              newJobs.push(job);
            }
          });
          return newJobs;
        });
      }
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
      setLoadingApplications(true);
      // Get ALL applications (pending, accepted, rejected, withdrawn) for employments tab
      const appsResponse = await getMyApplications();
      let appsData: any[] = [];
      if (appsResponse?.data?.response && Array.isArray(appsResponse.data.response)) {
        appsData = appsResponse.data.response;
      } else if (Array.isArray(appsResponse?.data)) {
        appsData = appsResponse.data;
      }
      
      // Get ALL applications regardless of status
      // This includes all jobs where the tasker has applied (pending, accepted, rejected, withdrawn)
      const allApps = appsData; // Include all applications
      
      // Get job details for each application
      const { getJob } = await import("../../lib/api/jobs.api");
      const jobsList: Job[] = [];
      for (const app of allApps) {
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
            // Include all job statuses (open, in_progress, completed, cancelled)
            jobsList.push({
              jobId: jobData.jobId,
              title: jobData.title,
              description: jobData.description || "",
              budget: jobData.budget,
              city: jobData.city,
              province: jobData.province,
              requiredSkills: jobData.requiredSkills,
              requiredExpertise: jobData.requiredExpertise,
              status: jobData.status, // Job status: open, in_progress, completed, cancelled
              applicationsCount: jobData.applicationsCount || 0,
              deadline: jobData.deadline,
              jobType: jobData.jobType,
              estimatedHours: jobData.estimatedHours,
              customerId: jobData.customerId,
              createdAt: jobData.createdAt,
              employmentStatus: app.status?.toLowerCase(), // Application status: pending, accepted, rejected, withdrawn
            });
          }
        } catch (err) {
          console.error(`Failed to fetch job ${app.jobId}:`, err);
        }
      }
      
      setEmployedJobs(jobsList);
    } catch (error) {
      console.error("Load employed jobs error:", error);
    } finally {
      setLoadingApplications(false);
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
    // Apply filters based on active tab
    if (activeTab === "my-jobs") {
      // Search filter
      if (myJobsSearchQuery) {
        const searchLower = myJobsSearchQuery.toLowerCase();
        if (!job.title.toLowerCase().includes(searchLower) &&
            !job.description.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      
      // Status filter
      if (myJobsStatusFilter !== "all" && job.status !== myJobsStatusFilter) {
        return false;
      }
      
      // Budget filter
      if (myJobsBudgetFilter !== "all") {
        const budget = job.budget;
        switch (myJobsBudgetFilter) {
          case "0-5000":
            if (budget > 5000) return false;
            break;
          case "5000-10000":
            if (budget < 5000 || budget > 10000) return false;
            break;
          case "10000-25000":
            if (budget < 10000 || budget > 25000) return false;
            break;
          case "25000-50000":
            if (budget < 25000 || budget > 50000) return false;
            break;
          case "50000+":
            if (budget < 50000) return false;
            break;
        }
      }
      
      // Location filter
      if (myJobsLocationFilter) {
        const locationLower = myJobsLocationFilter.toLowerCase();
        const cityMatch = job.city && job.city.toLowerCase().includes(locationLower);
        const provinceMatch = job.province && job.province.toLowerCase().includes(locationLower);
        if (!cityMatch && !provinceMatch) return false;
      }
      
      // Date filter
      if (myJobsDateFilter !== "all") {
        const jobDate = new Date(job.createdAt);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        switch (myJobsDateFilter) {
          case "today":
            if (jobDate < today) return false;
            break;
          case "week":
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            if (jobDate < weekAgo) return false;
            break;
          case "month":
            const monthAgo = new Date(today);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            if (jobDate < monthAgo) return false;
            break;
          case "3months":
            const threeMonthsAgo = new Date(today);
            threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
            if (jobDate < threeMonthsAgo) return false;
            break;
          case "year":
            const yearAgo = new Date(today);
            yearAgo.setFullYear(yearAgo.getFullYear() - 1);
            if (jobDate < yearAgo) return false;
            break;
        }
      }
    } else if (activeTab === "employed") {
      // Employments tab filters
      if (employedSearchQuery) {
        const searchLower = employedSearchQuery.toLowerCase();
        if (!job.title.toLowerCase().includes(searchLower) &&
            !job.description.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      
      // Task status filter (job status)
      if (employedTaskStatusFilter !== "all" && job.status !== employedTaskStatusFilter) {
        return false;
      }
      
      // Employment status filter (application status)
      if (employedEmploymentStatusFilter !== "all") {
        const employmentStatus = job.employmentStatus || "";
        if (employmentStatus !== employedEmploymentStatusFilter) {
          return false;
        }
      }
      
      // Budget filter
      if (employedBudgetFilter !== "all") {
        const budget = job.budget;
        switch (employedBudgetFilter) {
          case "0-5000":
            if (budget > 5000) return false;
            break;
          case "5000-10000":
            if (budget < 5000 || budget > 10000) return false;
            break;
          case "10000-25000":
            if (budget < 10000 || budget > 25000) return false;
            break;
          case "25000-50000":
            if (budget < 25000 || budget > 50000) return false;
            break;
          case "50000+":
            if (budget < 50000) return false;
            break;
        }
      }
      
      // Location filter
      if (employedLocationFilter) {
        const locationLower = employedLocationFilter.toLowerCase();
        const cityMatch = job.city && job.city.toLowerCase().includes(locationLower);
        const provinceMatch = job.province && job.province.toLowerCase().includes(locationLower);
        if (!cityMatch && !provinceMatch) return false;
      }
      
      // Date filter
      if (employedDateFilter !== "all") {
        const jobDate = new Date(job.createdAt);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        switch (employedDateFilter) {
          case "today":
            if (jobDate < today) return false;
            break;
          case "week":
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            if (jobDate < weekAgo) return false;
            break;
          case "month":
            const monthAgo = new Date(today);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            if (jobDate < monthAgo) return false;
            break;
          case "3months":
            const threeMonthsAgo = new Date(today);
            threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
            if (jobDate < threeMonthsAgo) return false;
            break;
          case "year":
            const yearAgo = new Date(today);
            yearAgo.setFullYear(yearAgo.getFullYear() - 1);
            if (jobDate < yearAgo) return false;
            break;
        }
      }
    } else {
      // Browse tab filters
      if (searchQuery) {
        const matchesSearch = 
          job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          job.description.toLowerCase().includes(searchQuery.toLowerCase());
        if (!matchesSearch) return false;
      }
      if (statusFilter && statusFilter !== "all") {
        if (job.status !== statusFilter) return false;
      }
      
      // Budget filter
      if (browseBudgetFilter !== "all") {
        const budget = job.budget;
        switch (browseBudgetFilter) {
          case "0-5000":
            if (budget > 5000) return false;
            break;
          case "5000-10000":
            if (budget < 5000 || budget > 10000) return false;
            break;
          case "10000-25000":
            if (budget < 10000 || budget > 25000) return false;
            break;
          case "25000-50000":
            if (budget < 25000 || budget > 50000) return false;
            break;
          case "50000+":
            if (budget < 50000) return false;
            break;
        }
      }
      
      // Location filter
      if (browseLocationFilter) {
        const locationLower = browseLocationFilter.toLowerCase();
        const cityMatch = job.city && job.city.toLowerCase().includes(locationLower);
        const provinceMatch = job.province && job.province.toLowerCase().includes(locationLower);
        if (!cityMatch && !provinceMatch) return false;
      }
      
      // Date filter
      if (browseDateFilter !== "all") {
        const jobDate = new Date(job.createdAt);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        switch (browseDateFilter) {
          case "today":
            if (jobDate < today) return false;
            break;
          case "week":
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            if (jobDate < weekAgo) return false;
            break;
          case "month":
            const monthAgo = new Date(today);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            if (jobDate < monthAgo) return false;
            break;
          case "3months":
            const threeMonthsAgo = new Date(today);
            threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
            if (jobDate < threeMonthsAgo) return false;
            break;
          case "year":
            const yearAgo = new Date(today);
            yearAgo.setFullYear(yearAgo.getFullYear() - 1);
            if (jobDate < yearAgo) return false;
            break;
        }
      }
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
              {activeTab === "employed" && "Your employments"}
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
                    Employments ({employedJobs.length})
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

        {/* Search and Filters - My Jobs Tab */}
        {activeTab === "my-jobs" && (
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search jobs by title or description..."
                  value={myJobsSearchQuery}
                  onChange={(e) => setMyJobsSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={() => setShowMyJobsFilters(!showMyJobsFilters)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <FiFilter />
                Filters
              </button>
            </div>

            {showMyJobsFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Status Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={myJobsStatusFilter}
                      onChange={(e) => setMyJobsStatusFilter(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      aria-label="Filter jobs by status"
                    >
                      <option value="all">All Status</option>
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  {/* Budget Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Budget</label>
                    <select
                      value={myJobsBudgetFilter}
                      onChange={(e) => setMyJobsBudgetFilter(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      aria-label="Filter jobs by budget"
                    >
                      <option value="all">All Budgets</option>
                      <option value="0-5000">₱0 - ₱5,000</option>
                      <option value="5000-10000">₱5,000 - ₱10,000</option>
                      <option value="10000-25000">₱10,000 - ₱25,000</option>
                      <option value="25000-50000">₱25,000 - ₱50,000</option>
                      <option value="50000+">₱50,000+</option>
                    </select>
                  </div>

                  {/* Location Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input
                      type="text"
                      placeholder="City/Municipality or Province"
                      value={myJobsLocationFilter}
                      onChange={(e) => setMyJobsLocationFilter(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Date Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <select
                      value={myJobsDateFilter}
                      onChange={(e) => setMyJobsDateFilter(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      aria-label="Filter jobs by date"
                    >
                      <option value="all">All Dates</option>
                      <option value="today">Today</option>
                      <option value="week">This Week</option>
                      <option value="month">This Month</option>
                      <option value="3months">Last 3 Months</option>
                      <option value="year">This Year</option>
                    </select>
                  </div>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => {
                      setMyJobsSearchQuery("");
                      setMyJobsStatusFilter("all");
                      setMyJobsBudgetFilter("all");
                      setMyJobsLocationFilter("");
                      setMyJobsDateFilter("all");
                    }}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Clear all filters
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Status Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      aria-label="Filter jobs by status"
                    >
                      <option value="all">All Status</option>
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  {/* Budget Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Budget</label>
                    <select
                      value={browseBudgetFilter}
                      onChange={(e) => setBrowseBudgetFilter(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      aria-label="Filter jobs by budget"
                    >
                      <option value="all">All Budgets</option>
                      <option value="0-5000">₱0 - ₱5,000</option>
                      <option value="5000-10000">₱5,000 - ₱10,000</option>
                      <option value="10000-25000">₱10,000 - ₱25,000</option>
                      <option value="25000-50000">₱25,000 - ₱50,000</option>
                      <option value="50000+">₱50,000+</option>
                    </select>
                  </div>

                  {/* Location Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input
                      type="text"
                      placeholder="City/Municipality or Province"
                      value={browseLocationFilter}
                      onChange={(e) => setBrowseLocationFilter(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Date Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <select
                      value={browseDateFilter}
                      onChange={(e) => setBrowseDateFilter(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      aria-label="Filter jobs by date"
                    >
                      <option value="all">All Dates</option>
                      <option value="today">Today</option>
                      <option value="week">This Week</option>
                      <option value="month">This Month</option>
                      <option value="3months">Last 3 Months</option>
                      <option value="year">This Year</option>
                    </select>
                  </div>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setStatusFilter("all");
                      setBrowseBudgetFilter("all");
                      setBrowseLocationFilter("");
                      setBrowseDateFilter("all");
                    }}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Clear all filters
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Employments Tab Content */}
        {activeTab === "employed" && (
          <div className="mb-6">
            {/* Search and Filters for Employments */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search jobs by title or description..."
                    value={employedSearchQuery}
                    onChange={(e) => setEmployedSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={() => setShowEmployedFilters(!showEmployedFilters)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                >
                  <FiFilter />
                  Filters
                </button>
              </div>

              {showEmployedFilters && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* Task Status Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Task Status</label>
                      <select
                        value={employedTaskStatusFilter}
                        onChange={(e) => setEmployedTaskStatusFilter(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        aria-label="Filter jobs by task status"
                      >
                        <option value="all">All Task Status</option>
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>

                    {/* Employment Status Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Employment Status</label>
                      <select
                        value={employedEmploymentStatusFilter}
                        onChange={(e) => setEmployedEmploymentStatusFilter(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        aria-label="Filter jobs by employment status"
                      >
                        <option value="all">All Employment Status</option>
                        <option value="pending">Pending</option>
                        <option value="accepted">Accepted</option>
                        <option value="rejected">Fired</option>
                        <option value="withdrawn">Resigned</option>
                      </select>
                    </div>

                    {/* Budget Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Budget</label>
                      <select
                        value={employedBudgetFilter}
                        onChange={(e) => setEmployedBudgetFilter(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        aria-label="Filter jobs by budget"
                      >
                        <option value="all">All Budgets</option>
                        <option value="0-5000">₱0 - ₱5,000</option>
                        <option value="5000-10000">₱5,000 - ₱10,000</option>
                        <option value="10000-25000">₱10,000 - ₱25,000</option>
                        <option value="25000-50000">₱25,000 - ₱50,000</option>
                        <option value="50000+">₱50,000+</option>
                      </select>
                    </div>

                    {/* Location Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                      <input
                        type="text"
                        placeholder="City/Municipality or Province"
                        value={employedLocationFilter}
                        onChange={(e) => setEmployedLocationFilter(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {/* Date Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                      <select
                        value={employedDateFilter}
                        onChange={(e) => setEmployedDateFilter(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        aria-label="Filter jobs by date"
                      >
                        <option value="all">All Dates</option>
                        <option value="today">Today</option>
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                        <option value="3months">Last 3 Months</option>
                        <option value="year">This Year</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-4">
                    <button
                      onClick={() => {
                        setEmployedSearchQuery("");
                        setEmployedTaskStatusFilter("all");
                        setEmployedEmploymentStatusFilter("all");
                        setEmployedBudgetFilter("all");
                        setEmployedLocationFilter("");
                        setEmployedDateFilter("all");
                      }}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Clear all filters
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Applications Tab Content */}
        {activeTab === "applications" && (
          <div className="mb-6">
            {/* Search and Filters for Applications */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search applications by job title..."
                    value={applicationSearchQuery}
                    onChange={(e) => setApplicationSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={() => setShowApplicationFilters(!showApplicationFilters)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                >
                  <FiFilter />
                  Filters
                </button>
              </div>

              {showApplicationFilters && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Status Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        value={applicationStatusFilter}
                        onChange={(e) => setApplicationStatusFilter(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        aria-label="Filter applications by status"
                      >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="accepted">Accepted</option>
                        <option value="rejected">Rejected</option>
                        <option value="withdrawn">Withdrawn</option>
                      </select>
                    </div>

                    {/* Date Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                      <select
                        value={applicationDateFilter}
                        onChange={(e) => setApplicationDateFilter(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        aria-label="Filter applications by date"
                      >
                        <option value="all">All Dates</option>
                        <option value="today">Today</option>
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                        <option value="3months">Last 3 Months</option>
                        <option value="year">This Year</option>
                      </select>
                    </div>

                    {/* Budget Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Budget</label>
                      <select
                        value={applicationBudgetFilter}
                        onChange={(e) => setApplicationBudgetFilter(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        aria-label="Filter applications by budget"
                      >
                        <option value="all">All Budgets</option>
                        <option value="0-5000">₱0 - ₱5,000</option>
                        <option value="5000-10000">₱5,000 - ₱10,000</option>
                        <option value="10000-25000">₱10,000 - ₱25,000</option>
                        <option value="25000-50000">₱25,000 - ₱50,000</option>
                        <option value="50000+">₱50,000+</option>
                      </select>
                    </div>

                    {/* Location Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                      <input
                        type="text"
                        placeholder="City or Province"
                        value={applicationLocationFilter}
                        onChange={(e) => setApplicationLocationFilter(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

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
            ) : (() => {
              // Filter applications
              const filteredApplications = applications.filter((app) => {
                const job = jobs.find((j) => j.jobId === app.jobId);
                if (!job) return false;

                // Search filter
                if (applicationSearchQuery) {
                  const searchLower = applicationSearchQuery.toLowerCase();
                  if (!job.title.toLowerCase().includes(searchLower) &&
                      !(app.coverLetter && app.coverLetter.toLowerCase().includes(searchLower))) {
                    return false;
                  }
                }

                // Status filter
                if (applicationStatusFilter !== "all" && app.status !== applicationStatusFilter) {
                  return false;
                }

                // Date filter
                if (applicationDateFilter !== "all") {
                  const appDate = new Date(app.createdAt);
                  const now = new Date();
                  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                  
                  switch (applicationDateFilter) {
                    case "today":
                      if (appDate < today) return false;
                      break;
                    case "week":
                      const weekAgo = new Date(today);
                      weekAgo.setDate(weekAgo.getDate() - 7);
                      if (appDate < weekAgo) return false;
                      break;
                    case "month":
                      const monthAgo = new Date(today);
                      monthAgo.setMonth(monthAgo.getMonth() - 1);
                      if (appDate < monthAgo) return false;
                      break;
                    case "3months":
                      const threeMonthsAgo = new Date(today);
                      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
                      if (appDate < threeMonthsAgo) return false;
                      break;
                    case "year":
                      const yearAgo = new Date(today);
                      yearAgo.setFullYear(yearAgo.getFullYear() - 1);
                      if (appDate < yearAgo) return false;
                      break;
                  }
                }

                // Budget filter
                if (applicationBudgetFilter !== "all") {
                  const budget = job.budget;
                  switch (applicationBudgetFilter) {
                    case "0-5000":
                      if (budget > 5000) return false;
                      break;
                    case "5000-10000":
                      if (budget < 5000 || budget > 10000) return false;
                      break;
                    case "10000-25000":
                      if (budget < 10000 || budget > 25000) return false;
                      break;
                    case "25000-50000":
                      if (budget < 25000 || budget > 50000) return false;
                      break;
                    case "50000+":
                      if (budget < 50000) return false;
                      break;
                  }
                }

                // Location filter
                if (applicationLocationFilter) {
                  const locationLower = applicationLocationFilter.toLowerCase();
                  const cityMatch = job.city && job.city.toLowerCase().includes(locationLower);
                  const provinceMatch = job.province && job.province.toLowerCase().includes(locationLower);
                  if (!cityMatch && !provinceMatch) return false;
                }

                return true;
              });

              return filteredApplications.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                  <p className="text-gray-500">No applications match your filters</p>
                  <button
                    onClick={() => {
                      setApplicationSearchQuery("");
                      setApplicationStatusFilter("all");
                      setApplicationDateFilter("all");
                      setApplicationBudgetFilter("all");
                      setApplicationLocationFilter("");
                    }}
                    className="mt-4 text-blue-600 hover:underline"
                  >
                    Clear all filters
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredApplications.map((app) => {
                    const job = jobs.find((j) => j.jobId === app.jobId);
                    if (!job) return null;
                    return (
                    <div
                      key={app.applicationId}
                      className="bg-white rounded-lg shadow-sm p-4 sm:p-6 hover:shadow-md transition"
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-3">
                        <div className="flex-1 w-full">
                          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">{job.title}</h3>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-semibold text-gray-700">₱</span>
                              <span className="font-semibold text-gray-900">{job.budget.toLocaleString()}</span>
                            </div>
                            {(job.city || job.province) && (
                              <div className="flex items-center gap-2">
                                <FiMapPin className="w-4 h-4 text-gray-500" />
                                <span>
                                  {job.city && job.province
                                    ? `${job.city}, ${job.province}`
                                    : job.city || job.province}
                                </span>
                              </div>
                            )}
                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                              app.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                              app.status === "accepted" ? "bg-green-100 text-green-800" :
                              app.status === "rejected" ? "bg-red-100 text-red-800" :
                              app.status === "withdrawn" ? "bg-gray-100 text-gray-800" :
                              "bg-gray-100 text-gray-800"
                            }`}>
                              {app.status.toUpperCase()}
                            </span>
                          </div>
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
                          onClick={async () => {
                            setViewingApplication(app);
                            setViewingJob(job);
                            setCurrentMatchPercentage(null);
                            
                            // Fetch current match percentage
                            if (user?.userId) {
                              try {
                                const matchResponse = await getMatchPercentage(job.jobId, user.userId);
                                const matchData = matchResponse?.data?.response || matchResponse?.data?.data || matchResponse?.data;
                                if (matchData?.matchPercentage !== undefined) {
                                  setCurrentMatchPercentage(matchData.matchPercentage);
                                }
                              } catch (err) {
                                console.error("Failed to fetch match percentage:", err);
                              }
                            }
                          }}
                          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold text-sm shadow-sm"
                        >
                          <FiEye className="w-4 h-4" />
                          View Application
                        </button>
                        <Link
                          to={`/jobs/${job.jobId}`}
                          className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm"
                        >
                          <FiEye className="w-4 h-4" />
                          View Job
                        </Link>
                      </div>
                    </div>
                  );
                  })}
                </div>
              );
            })()}
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
                  {activeTab === "employed" && "You have no employments"}
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
                    <span className="text-lg font-semibold text-gray-700">₱</span>
                    <span className="font-semibold text-gray-900">
                      {job.budget.toLocaleString()}
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

                {job.requiredExpertise && (
                  <div className="mb-4">
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded font-medium">
                      {job.requiredExpertise}
                    </span>
                  </div>
                )}
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
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            navigate(`/jobs/${job.jobId}/edit`);
                          }}
                          className="flex-1 text-center px-3 py-2 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition text-sm"
                        >
                          Edit
                        </button>
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
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        navigate(`/jobs/${job.jobId}`);
                      }}
                      className="flex-1 text-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm"
                    >
                      View
                    </button>
                  </div>
                )}
              </Link>
            ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* View Application Modal */}
      {viewingApplication && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Application Details</h2>
                <button
                  onClick={() => {
                    setViewingApplication(null);
                    setViewingJob(null);
                    setCurrentMatchPercentage(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              {viewingJob && (
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{viewingJob.title}</h3>
                  <div className="flex flex-col gap-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700">Budget:</span>
                      <div className="flex items-center gap-1">
                        <span className="text-lg font-semibold text-gray-700">₱</span>
                        <span className="font-semibold text-gray-900">
                          {viewingJob.budget.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    {(viewingJob.city || viewingJob.province) && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-700">Location:</span>
                        <div className="flex items-center gap-1">
                          <FiMapPin className="w-4 h-4 text-gray-500" />
                          <span>
                            {viewingJob.city && viewingJob.province
                              ? `${viewingJob.city}, ${viewingJob.province}`
                              : viewingJob.city || viewingJob.province}
                          </span>
                        </div>
                      </div>
                    )}
                    {(currentMatchPercentage !== null || (viewingApplication.matchPercentage !== undefined && viewingApplication.matchPercentage !== null)) && (
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {(currentMatchPercentage !== null ? currentMatchPercentage : viewingApplication.matchPercentage)}% Match
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Application Status</label>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      viewingApplication.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                      viewingApplication.status === "accepted" ? "bg-green-100 text-green-800" :
                      viewingApplication.status === "rejected" ? "bg-red-100 text-red-800" :
                      viewingApplication.status === "withdrawn" ? "bg-gray-100 text-gray-800" :
                      "bg-gray-100 text-gray-800"
                    }`}>
                      {viewingApplication.status.toUpperCase()}
                    </span>
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
                    setCurrentMatchPercentage(null);
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

export default BrowseJobs;

