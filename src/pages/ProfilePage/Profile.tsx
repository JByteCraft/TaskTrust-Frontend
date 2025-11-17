import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import ProfileHero, {
  type ProfileStats,
} from "./components/ProfileHero";
import ProfileTabs from "./components/ProfileTabs";
import ProfileCard from "./components/ProfileCard";
import EditProfileModal from "./components/EditProfileModal";
import UploadAvatarModal from "./components/UploadAvatarModal";
import UploadCoverModal from "./components/UploadCoverModal";
import PortfolioModal from "./components/PortfolioModal";
import ReviewsSection from "./components/ReviewsSection";
import CreateReviewModal from "./components/CreateReviewModal";
import CreatePost from "../../components/CreatePost";
import PostCard from "../../components/PostCard";
import { GET, PATCH } from "../../lib/utils/fetch.utils";
import {
  getAuthenticatedUserFromToken,
  getStoredAuthToken,
} from "../../lib/utils/auth.utils";
import { getUserPosts } from "../../lib/api/posts.api";
import {
  getPortfolioItems,
  createPortfolioItem,
  updatePortfolioItem,
  deletePortfolioItem,
} from "../../lib/api/portfolio.api";

type ProfileData = {
  name: string;
  role: string;
  avatarUrl?: string;
  coverUrl?: string;
  stats: ProfileStats;
  bio?: string;
};


const DEFAULT_PROFILE: ProfileData = {
  name: "TaskTrust Member",
  role: "Member",
  avatarUrl: "",
  coverUrl: "",
  stats: {
    connections: 0,
    tasksCompleted: 0,
    rating: 0,
    reviews: 0,
  },
  bio: "",
};

const Profile = () => {
  const { userId: urlUserId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<ProfileData>(DEFAULT_PROFILE);
  const [rawUserData, setRawUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("posts");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showUploadCoverModal, setShowUploadCoverModal] = useState(false);
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [showCreateReviewModal, setShowCreateReviewModal] = useState(false);
  const [editingPortfolioItem, setEditingPortfolioItem] = useState<any>(null);
  const [portfolioItems, setPortfolioItems] = useState<any[]>([]);
  const [loadingPortfolio, setLoadingPortfolio] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [postUsers, setPostUsers] = useState<{ [key: number]: any }>({});
  const [loadingPosts, setLoadingPosts] = useState(false);

  // Get current user info
  const authPayload = getAuthenticatedUserFromToken<{
    userId?: number;
    id?: number;
    sub?: number | string;
    role?: string;
    firstName?: string;
    lastName?: string;
    middleName?: string;
    name?: string;
  }>();

  const currentUserId =
    authPayload?.userId ??
    authPayload?.id ??
    (typeof authPayload?.sub === "string"
      ? Number(authPayload?.sub)
      : authPayload?.sub);

  // Use URL userId if provided, otherwise use current user's ID
  const targetUserId = urlUserId ? Number(urlUserId) : currentUserId;
  const isViewingOwnProfile = targetUserId === currentUserId;

  const fetchProfile = async () => {
      const token = getStoredAuthToken();
      if (!token) {
        setError("No active session found. Please log in again.");
        setLoading(false);
        return;
      }

      if (!targetUserId || Number.isNaN(Number(targetUserId))) {
        setError("Unable to identify the user. Please sign in again.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Use public endpoint if viewing another user's profile
        const endpoint = isViewingOwnProfile 
          ? `/users/${targetUserId}` 
          : `/users/${targetUserId}/public`;
        
        const response = await GET<any>(
          endpoint,
          "",
          token
        );
        const statusCode =
          response?.status ??
          response?.statusCode ??
          response?.code ??
          response?.data?.status ??
          response?.data?.statusCode;

        if (statusCode && Number(statusCode) >= 400) {
          const message =
            response?.message ||
            response?.error ||
            response?.data?.message ||
            "Unable to load profile at this time.";
          setError(message);
          return;
        }

        // Extract payload - handle both public and private endpoint responses
        let payload: any = {};
        if (response?.response && typeof response.response === 'object') {
          // Public endpoint returns: { status: 200, response: userData, message: '...' }
          payload = response.response;
        } else if (response?.data && typeof response.data === 'object') {
          payload = response.data;
        } else {
          payload = response?.profile || response?.user || response || {};
        }

        const firstName =
          payload?.firstName ||
          payload?.first_name ||
          payload?.givenName ||
          payload?.user?.firstName ||
          payload?.user?.first_name ||
          "";
        const middleName =
          payload?.middleName ||
          payload?.middle_name ||
          payload?.user?.middleName ||
          "";
        const lastName =
          payload?.lastName ||
          payload?.last_name ||
          payload?.surname ||
          payload?.user?.lastName ||
          payload?.user?.last_name ||
          "";

        const resolvedName =
          [firstName, middleName, lastName].filter(Boolean).join(" ") ||
          payload?.name ||
          DEFAULT_PROFILE.name;

        const resolvedRole =
          payload?.role ||
          authPayload?.role ||
          payload?.userRole ||
          payload?.user?.role ||
          payload?.roles?.[0] ||
          payload?.user?.roles?.[0] ||
          DEFAULT_PROFILE.role;

        const statsSource =
          payload?.stats ||
          payload?.statistics ||
          payload?.analytics ||
          payload;

        const normalizedProfile: ProfileData = {
          name: resolvedName,
          role: resolvedRole,
          avatarUrl:
            payload?.avatarUrl ||
            payload?.avatar ||
            payload?.profileImage ||
            payload?.profilePicture ||
            payload?.profilePictureUrl ||
            "",
          coverUrl:
            payload?.coverUrl ||
            payload?.coverPhoto ||
            payload?.coverPhotoUrl ||
            payload?.bannerImage ||
            "",
          bio: payload?.bio || payload?.summary || "",
          stats: {
            connections:
              Number(statsSource?.connections) ||
              Number(statsSource?.totalConnections) ||
              0,
            tasksCompleted:
              Number(statsSource?.tasksCompleted) ||
              Number(statsSource?.completedTasks) ||
              Number(statsSource?.tasks) ||
              0,
            rating:
              Number(statsSource?.rating) ||
              Number(statsSource?.averageRating) ||
              0,
            reviews:
              Number(statsSource?.reviews) ||
              Number(statsSource?.totalReviews) ||
              0,
          },
        };

        setProfile(normalizedProfile);
        setRawUserData(payload);
      } catch (err: any) {
        console.error("Profile fetch error:", err);
        setError(
          err?.message || "Something went wrong while fetching profile data."
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchProfile();
  }, [urlUserId]); // Refetch when URL userId changes

  useEffect(() => {
    if (targetUserId && !Number.isNaN(Number(targetUserId))) {
      loadUserPosts();
      loadPortfolioItems();
    }
  }, [targetUserId]);

  const loadUserPosts = async () => {
    if (!targetUserId || Number.isNaN(Number(targetUserId))) return;
    
    const token = getStoredAuthToken();
    if (!token) return;

    try {
      setLoadingPosts(true);
      const response = await getUserPosts(targetUserId);
      
      // Extract posts from response
      let postsData: any[] = [];
      if (response?.data) {
        if (response.data.response && Array.isArray(response.data.response)) {
          postsData = response.data.response;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          postsData = response.data.data;
        } else if (Array.isArray(response.data)) {
          postsData = response.data;
        }
      }
      
      setPosts(Array.isArray(postsData) ? postsData : []);

      // Load user data for post authors
      const userIds = [...new Set(postsData.map((post: any) => post.userId).filter(Boolean))];
      if (userIds.length > 0) {
        await loadPostUsers(userIds);
      }
    } catch (error) {
      console.error("Load user posts error:", error);
    } finally {
      setLoadingPosts(false);
    }
  };

  const loadPostUsers = async (userIds: number[]) => {
    if (userIds.length === 0) return;
    
    const token = getStoredAuthToken();
    if (!token) return;

    const usersMap: { [key: number]: any } = { ...postUsers };

    for (const userId of userIds) {
      if (usersMap[userId]) continue;

      try {
        const response = await GET<any>(`/users/${userId}/public`, "", token);
        
        let userData: any = null;
        if (response?.response && typeof response.response === 'object' && response.response.userId) {
          userData = response.response;
        } else if (response?.data && typeof response.data === 'object' && response.data.userId) {
          userData = response.data;
        } else if (response?.userId) {
          userData = response;
        }
          
        if (userData && userData.userId) {
          usersMap[userId] = {
            userId: userData.userId,
            firstName: userData.firstName || "",
            lastName: userData.lastName || "",
            profilePictureUrl: userData.profilePictureUrl,
            isLegit: userData.isLegit,
          };
        }
      } catch (error) {
        console.error(`Failed to fetch post user ${userId}:`, error);
      }
    }

    setPostUsers(usersMap);
  };

  const handlePostCreated = () => {
    loadUserPosts();
  };

  const handlePostDeleted = (postId: number) => {
    setPosts(posts.filter((p) => p.postId !== postId));
  };

  const loadPortfolioItems = async () => {
    if (!targetUserId || Number.isNaN(Number(targetUserId))) return;
    
    const token = getStoredAuthToken();
    if (!token) return;

    try {
      setLoadingPortfolio(true);
      const response = await getPortfolioItems(targetUserId);
      // fetch.utils returns: { status, response, message }
      // For portfolio: response.response = { portfolios: [...] }
      let items: any[] = [];
      
      if (response?.response?.portfolios) {
        items = response.response.portfolios;
      } else if (response?.data?.portfolios) {
        items = response.data.portfolios;
      } else if (Array.isArray(response?.response)) {
        items = response.response;
      } else if (Array.isArray(response?.data)) {
        items = response.data;
      }
      
      setPortfolioItems(Array.isArray(items) ? items : []);
    } catch (error) {
      console.error("Load portfolio items error:", error);
    } finally {
      setLoadingPortfolio(false);
    }
  };

  const handleSavePortfolio = async (data: any) => {
    setSaving(true);
    try {
      if (editingPortfolioItem) {
        await updatePortfolioItem(editingPortfolioItem.portfolioId, data);
      } else {
        await createPortfolioItem(data);
      }
      await loadPortfolioItems();
      setShowPortfolioModal(false);
      setEditingPortfolioItem(null);
    } catch (error: any) {
      console.error("Save portfolio error:", error);
      alert(error.response?.data?.message || "Failed to save portfolio item");
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePortfolio = async (portfolioId: number) => {
    if (!confirm("Are you sure you want to delete this portfolio item?")) return;
    
    try {
      await deletePortfolioItem(portfolioId);
      await loadPortfolioItems();
    } catch (error: any) {
      console.error("Delete portfolio error:", error);
      alert(error.response?.data?.message || "Failed to delete portfolio item");
    }
  };

  const handleEditPortfolio = (item: any) => {
    setEditingPortfolioItem(item);
    setShowPortfolioModal(true);
  };

  const handleAddPortfolio = () => {
    setEditingPortfolioItem(null);
    setShowPortfolioModal(true);
  };

  const handleGenerateResume = async () => {
    if (!targetUserId || Number.isNaN(Number(targetUserId))) {
      alert("Unable to generate resume. Please try again.");
      return;
    }
    try {
      const { generateResume } = await import("../../lib/api/resume.api");
      const response = await generateResume(targetUserId);
      // fetch.utils returns: { status, response, message }
      // For resume: response.response = { resume: {...} }
      let resumeData: any = null;
      if (response?.response?.resume) {
        resumeData = response.response.resume;
      } else if (response?.data?.resume) {
        resumeData = response.data.resume;
      } else if (response?.response) {
        resumeData = response.response;
      } else if (response?.data) {
        resumeData = response.data;
      }

      if (!resumeData) {
        throw new Error("Failed to generate resume data");
      }

      // Simple text-based resume generation (can be enhanced with PDF library)
      const resumeText = `
RESUME
${"=".repeat(50)}

${resumeData.personalInfo.name}
${resumeData.personalInfo.email}
${resumeData.personalInfo.phone || ""}
${resumeData.personalInfo.address || ""}

PROFESSIONAL SUMMARY
${"-".repeat(50)}
${resumeData.personalInfo.bio || "No summary provided"}

SKILLS
${"-".repeat(50)}
${resumeData.skills?.join(", ") || "No skills listed"}

CERTIFICATIONS
${"-".repeat(50)}
${resumeData.certifications?.map((c: any) => 
  `• ${c.title}${c.issuer ? ` - ${c.issuer}` : ""}${c.date ? ` (${new Date(c.date).toLocaleDateString()})` : ""}`
).join("\n") || "No certifications"}

PROJECTS
${"-".repeat(50)}
${resumeData.projects?.map((p: any) => 
  `• ${p.title}${p.company ? ` - ${p.company}` : ""}${p.date ? ` (${new Date(p.date).toLocaleDateString()})` : ""}${p.description ? `\n  ${p.description}` : ""}`
).join("\n\n") || "No projects"}

WORK EXPERIENCE
${"-".repeat(50)}
${resumeData.workExperience?.map((job: any) => 
  `• ${job.title}${job.company ? ` at ${job.company}` : ""}${job.date ? ` (${new Date(job.date).toLocaleDateString()})` : ""}${job.description ? `\n  ${job.description}` : ""}`
).join("\n\n") || "No work experience"}

REVIEWS & RATINGS
${"-".repeat(50)}
Average Rating: ${resumeData.reviews?.averageRating || 0}/5
Total Reviews: ${resumeData.reviews?.totalReviews || 0}
      `.trim();

      // Create and download text file
      const blob = new Blob([resumeText], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${resumeData.personalInfo.name.replace(/\s+/g, "_")}_Resume.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      alert("Resume downloaded successfully!");
    } catch (error: any) {
      console.error("Generate resume error:", error);
      alert(error.response?.data?.message || "Failed to generate resume");
    }
  };

  const handleSaveProfile = async (updatedData: any) => {
    setSaving(true);
    const token = getStoredAuthToken();
    const authPayload = getAuthenticatedUserFromToken<{
      userId?: number;
      id?: number;
      sub?: number | string;
    }>();

    const resolvedUserId =
      authPayload?.userId ??
      authPayload?.id ??
      (typeof authPayload?.sub === "string"
        ? Number(authPayload?.sub)
        : authPayload?.sub);

    try {
      // Preserve profilePictureUrl if it exists in rawUserData
      // Remove skills if user is not a tasker
      const isTasker = rawUserData?.role === "tasker";
      const dataToSend: any = {
        ...updatedData,
        profilePictureUrl: updatedData.profilePictureUrl || rawUserData?.profilePictureUrl || ""
      };
      
      // Remove skills for customers (skills should only be for taskers)
      if (!isTasker && dataToSend.skills !== undefined) {
        delete dataToSend.skills;
      }
      
      const response = await PATCH<any>(
        `/users/${resolvedUserId}`,
        "",
        dataToSend,
        token || undefined
      );

      if (response?.status === 200 || response?.data || response?.user) {
        // If ID verification fields are present and complete, submit for verification
        if (
          resolvedUserId &&
          updatedData.idImgUrl &&
          updatedData.selfieImgUrl &&
          updatedData.idType &&
          updatedData.idNumber &&
          (!rawUserData?.verificationStatus || rawUserData?.verificationStatus === 'not_submitted' || rawUserData?.verificationStatus === 'rejected')
        ) {
          try {
            const { submitIdVerification } = await import("../../lib/api/admin.api");
            await submitIdVerification(resolvedUserId, {
              idImgUrl: updatedData.idImgUrl,
              selfieImgUrl: updatedData.selfieImgUrl,
              idType: updatedData.idType,
              idNumber: updatedData.idNumber,
            });
            alert("ID verification submitted successfully! Your documents are now pending review.");
          } catch (verifyErr: any) {
            console.error("Submit verification error:", verifyErr);
            // Don't block the profile update if verification submission fails
          }
        }
        
        // Close modal and reload profile data
        setShowEditModal(false);
        
        // Refetch profile to ensure all data is up-to-date
        await fetchProfile();
      }
    } catch (err: any) {
      console.error("Update profile error:", err);
      alert(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleUploadAvatar = async (avatarUrl: string) => {
    setUploading(true);
    const token = getStoredAuthToken();
    const authPayload = getAuthenticatedUserFromToken<{
      userId?: number;
      id?: number;
      sub?: number | string;
    }>();

    const resolvedUserId =
      authPayload?.userId ??
      authPayload?.id ??
      (typeof authPayload?.sub === "string"
        ? Number(authPayload?.sub)
        : authPayload?.sub);

    try {
      // Update user with new avatar URL from Cloudinary
      const response = await PATCH<any>(
        `/users/${resolvedUserId}`,
        "",
        { profilePictureUrl: avatarUrl },
        token || undefined
      );

      if (response?.status === 200 || response?.data || response?.user) {
        setProfile((prev) => ({ ...prev, avatarUrl }));
        setShowUploadModal(false);
        
        // Refetch to ensure data is synced
        await fetchProfile();
      }
    } catch (err: any) {
      console.error("Upload avatar error:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleUploadCover = async (coverUrl: string) => {
    setUploading(true);
    const token = getStoredAuthToken();
    const authPayload = getAuthenticatedUserFromToken<{
      userId?: number;
      id?: number;
      sub?: number | string;
    }>();

    const resolvedUserId =
      authPayload?.userId ??
      authPayload?.id ??
      (typeof authPayload?.sub === "string"
        ? Number(authPayload?.sub)
        : authPayload?.sub);

    try {
      // Update user with new cover photo URL from Cloudinary
      const response = await PATCH<any>(
        `/users/${resolvedUserId}`,
        "",
        { coverPhotoUrl: coverUrl },
        token || undefined
      );

      if (response?.status === 200 || response?.data || response?.user) {
        setProfile((prev) => ({ ...prev, coverUrl }));
        setShowUploadCoverModal(false);
        
        // Refetch to ensure data is synced
        await fetchProfile();
      }
    } catch (err: any) {
      console.error("Upload cover error:", err);
      alert(err.response?.data?.message || "Failed to upload cover photo");
    } finally {
      setUploading(false);
    }
  };

  const formattedRole = useMemo(() => {
    const role = profile.role || DEFAULT_PROFILE.role;
    return role.charAt(0).toUpperCase() + role.slice(1);
  }, [profile.role]);

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-200 via-white to-blue-200 pb-8 sm:pb-12 lg:pb-16">
      <div className="h-20 w-full bg-linear-to-r from-blue-200 via-white to-blue-100 sm:h-24 lg:h-28" />
      <div className="-mt-16 space-y-4 px-2 sm:-mt-20 sm:space-y-6 sm:px-3 lg:-mt-24 lg:px-4">
        {loading ? (
          <div className="animate-pulse space-y-6">
            <div className="h-64 rounded-3xl bg-white shadow-sm" />
            <div className="h-12 rounded-xl bg-white shadow-sm" />
            <div className="grid gap-6 xl:grid-cols-[2fr,1fr]">
              <div className="h-64 rounded-2xl bg-white shadow-sm" />
              <div className="h-64 rounded-2xl bg-white shadow-sm" />
            </div>
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-red-600">
              Unable to load profile
            </h2>
            <p className="mt-2 text-sm text-gray-600">{error}</p>
          </div>
        ) : (
          <>
            <ProfileHero
              name={profile.name}
              role={formattedRole}
              stats={profile.stats}
              avatarUrl={profile.avatarUrl}
              coverUrl={profile.coverUrl}
              isLegit={rawUserData?.isLegit}
              onEditProfile={isViewingOwnProfile ? () => setShowEditModal(true) : undefined}
              onUploadAvatar={isViewingOwnProfile ? () => setShowUploadModal(true) : undefined}
              onUploadCover={isViewingOwnProfile ? () => setShowUploadCoverModal(true) : undefined}
              onGenerateResume={isViewingOwnProfile && rawUserData?.role === "tasker" ? handleGenerateResume : undefined}
            />
            {/* Tabs for Mobile (Facebook style) */}
            <div className="block lg:hidden">
              <ProfileTabs
                tabs={[
                  { id: "summary", label: "Summary" },
                  { id: "schedule", label: "Schedule" },
                  { id: "portfolio", label: "Portfolio" },
                  { id: "reviews", label: "Reviews" },
                  { id: "posts", label: "Posts" },
                ]}
                activeTab={activeTab}
                onTabChange={setActiveTab}
              />
            </div>

            {/* Main Content: 2 Column Layout */}
            <div className="grid grid-cols-1 gap-0 lg:gap-6 lg:grid-cols-12">
                {/* Left Sidebar - 30% (Desktop only) */}
                <div className={`lg:col-span-4 space-y-4 ${activeTab !== "posts" && activeTab !== "summary" && activeTab !== "schedule" && activeTab !== "portfolio" && activeTab !== "reviews" ? "hidden lg:block" : ""}`}>
                {/* Professional Summary */}
                <div className={activeTab === "summary" ? "block" : activeTab === "posts" ? "hidden lg:block" : "hidden"}>
                  <ProfileCard
                    title="Professional Summary"
                    description="Your expertise and experience"
                  >
                    <div className="space-y-3">
                      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                        {profile.bio
                          ? profile.bio
                          : "Add your professional summary to showcase your skills and experience."}
                      </div>
                    </div>
                  </ProfileCard>

                  {/* Verification Status */}
                  <ProfileCard
                    title="Verification Status"
                    description="ID verification information"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Status:</span>
                        <span
                          className={`px-3 py-1 text-xs font-medium rounded-full ${
                            rawUserData?.isLegit
                              ? "bg-green-100 text-green-800"
                              : rawUserData?.verificationStatus === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : rawUserData?.verificationStatus === "rejected"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {rawUserData?.isLegit
                            ? "Verified"
                            : rawUserData?.verificationStatus === "pending"
                            ? "Pending Review"
                            : rawUserData?.verificationStatus === "rejected"
                            ? "Rejected"
                            : "Not Verified"}
                        </span>
                      </div>
                      {rawUserData?.idVerifiedAt && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">Verified On:</span>
                          <span className="text-sm text-gray-600">
                            {new Date(rawUserData.idVerifiedAt).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                      )}
                      {rawUserData?.verificationRejectionReason && (
                        <div className="mt-2 rounded-lg border border-red-200 bg-red-50 p-3">
                          <p className="text-xs font-medium text-red-800 mb-1">Rejection Reason:</p>
                          <p className="text-xs text-red-700">{rawUserData.verificationRejectionReason}</p>
                        </div>
                      )}
                      {(!rawUserData?.idImgUrl || !rawUserData?.selfieImgUrl) && (
                        <div className="mt-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
                          <p className="text-xs text-blue-800">
                            Upload your ID and selfie in Edit Profile to get verified and build trust with customers.
                          </p>
                        </div>
                      )}
                    </div>
                  </ProfileCard>
                </div>

                {/* Schedule */}
                <div className={activeTab === "schedule" ? "block" : activeTab === "posts" ? "hidden lg:block" : "hidden"}>
                  <ProfileCard
                    title="Schedule"
                    description="Your availability"
                    action={
                      isViewingOwnProfile ? (
                        <button
                          type="button"
                          className="rounded-full border border-blue-200 px-3 py-1 text-xs font-medium text-blue-600 transition hover:border-blue-300 hover:bg-blue-50"
                        >
                          Manage
                        </button>
                      ) : undefined
                    }
                  >
                    <p className="text-sm text-gray-500">
                      Update your weekly schedule so clients know when you&apos;re available.
                    </p>
                  </ProfileCard>
                </div>

                {/* Portfolio */}
                <div className={activeTab === "portfolio" ? "block" : activeTab === "posts" ? "hidden lg:block" : "hidden"}>
                  <ProfileCard
                    title="Portfolio"
                    description="Certifications and projects"
                    action={
                      isViewingOwnProfile ? (
                        <button
                          type="button"
                          onClick={handleAddPortfolio}
                          className="rounded-full border border-blue-200 px-3 py-1 text-xs font-medium text-blue-600 transition hover:border-blue-300 hover:bg-blue-50"
                        >
                          Add item
                        </button>
                      ) : undefined
                    }
                  >
                    {loadingPortfolio ? (
                      <div className="text-center py-8 text-gray-500">Loading portfolio...</div>
                    ) : portfolioItems.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-center text-sm text-gray-500">
                        No portfolio items yet
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {portfolioItems.map((item: any) => (
                          <div
                            key={item.portfolioId}
                            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="px-2 py-0.5 text-xs font-medium rounded bg-blue-100 text-blue-800">
                                    {item.type === "certification" ? "Certification" : "Project"}
                                  </span>
                                  <h4 className="font-semibold text-gray-900">{item.title}</h4>
                                </div>
                                {item.description && (
                                  <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                                )}
                                {item.type === "certification" && item.issuer && (
                                  <p className="text-xs text-gray-500">Issued by: {item.issuer}</p>
                                )}
                                {item.type === "project" && item.company && (
                                  <p className="text-xs text-gray-500">Client: {item.company}</p>
                                )}
                                {item.date && (
                                  <p className="text-xs text-gray-500">
                                    {new Date(item.date).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                              {isViewingOwnProfile && (
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleEditPortfolio(item)}
                                    className="text-blue-600 hover:text-blue-700 text-sm"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeletePortfolio(item.portfolioId)}
                                    className="text-red-600 hover:text-red-700 text-sm"
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                            {item.imageUrl && (
                              <img
                                src={item.imageUrl}
                                alt={item.title}
                                className="w-full h-48 object-cover rounded-lg mt-2"
                              />
                            )}
                            {item.imageUrls && item.imageUrls.length > 0 && (
                              <div className="grid grid-cols-3 gap-2 mt-2">
                                {item.imageUrls.map((url: string, idx: number) => (
                                  <img
                                    key={idx}
                                    src={url}
                                    alt={`${item.title} ${idx + 1}`}
                                    className="w-full h-24 object-cover rounded"
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </ProfileCard>
                </div>

                {/* Tasker Reviews */}
                <div className={activeTab === "reviews" ? "block" : activeTab === "posts" ? "hidden lg:block" : "hidden"}>
                  <ProfileCard
                    title="Tasker Reviews"
                    description="Client feedback"
                    action={
                      !isViewingOwnProfile && rawUserData?.role === "tasker" ? (
                        <button
                          type="button"
                          onClick={() => setShowCreateReviewModal(true)}
                          className="rounded-full border border-blue-200 px-3 py-1 text-xs font-medium text-blue-600 transition hover:border-blue-300 hover:bg-blue-50"
                        >
                          Write Review
                        </button>
                      ) : undefined
                    }
                  >
                    {rawUserData?.role === "tasker" && targetUserId ? (
                      <ReviewsSection
                        taskerId={targetUserId}
                        isViewingOwnProfile={isViewingOwnProfile}
                      />
                    ) : (
                      <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-center text-sm text-gray-400">
                        Reviews are only available for taskers
                      </div>
                    )}
                  </ProfileCard>
                </div>
                </div>

                {/* Right Content Area - 70% (Posts Feed) */}
                <div className={`lg:col-span-8 ${activeTab === "posts" ? "block" : "hidden lg:block"}`}>
                {/* Create Post Box - Only show for own profile */}
                {isViewingOwnProfile && (
                  <div className="mb-4">
                    <CreatePost onPostCreated={handlePostCreated} />
                  </div>
                )}

                {/* Posts Feed */}
                <div className="space-y-4">
                  {loadingPosts ? (
                    <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
                      <p className="text-gray-500">Loading posts...</p>
                    </div>
                  ) : posts.length === 0 ? (
                    <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
                      <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                        <svg
                          className="h-8 w-8 text-blue-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        No posts yet
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {isViewingOwnProfile 
                          ? "Posts you create will appear here"
                          : "This user hasn't posted anything yet"}
                      </p>
                    </div>
                  ) : (
                    posts.map((post) => (
                      <PostCard
                        key={post.postId}
                        post={post}
                        author={postUsers[post.userId]}
                        onPostDeleted={() => handlePostDeleted(post.postId)}
                      />
                    ))
                  )}
                </div>
                </div>
            </div>
          </>
        )}
      </div>

      {/* Edit Profile Modal */}
      {rawUserData && (
        <EditProfileModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSave={handleSaveProfile}
          userRole={rawUserData.role}
          initialData={{
            firstName: rawUserData.firstName || "",
            lastName: rawUserData.lastName || "",
            middleName: rawUserData.middleName || "",
            gender: rawUserData.gender || "male",
            email: rawUserData.email || "",
            phoneNumber: rawUserData.phoneNumber || "",
            dateOfBirth: rawUserData.dateOfBirth
              ? new Date(rawUserData.dateOfBirth).toISOString().split("T")[0]
              : "",
            expertise: rawUserData.expertise || "",
            bio: rawUserData.bio || "",
            skills: rawUserData.skills || [],
            street: rawUserData.street || "",
            barangay: rawUserData.barangay || "",
            city: rawUserData.city || "",
            province: rawUserData.province || "",
            zipCode: rawUserData.zipCode || "",
            profilePictureUrl: rawUserData.profilePictureUrl || "",
            idType: rawUserData.idType || "",
            idNumber: rawUserData.idNumber || "",
            idImgUrl: rawUserData.idImgUrl || "",
            selfieImgUrl: rawUserData.selfieImgUrl || "",
          }}
          loading={saving}
        />
      )}

      {/* Upload Avatar Modal */}
      <UploadAvatarModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUpload={handleUploadAvatar}
        currentAvatarUrl={profile.avatarUrl}
        loading={uploading}
      />

      <UploadCoverModal
        isOpen={showUploadCoverModal}
        onClose={() => setShowUploadCoverModal(false)}
        onUpload={handleUploadCover}
        currentCoverUrl={profile.coverUrl}
        loading={uploading}
      />

      <PortfolioModal
        isOpen={showPortfolioModal}
        onClose={() => {
          setShowPortfolioModal(false);
          setEditingPortfolioItem(null);
        }}
        onSave={handleSavePortfolio}
        initialData={editingPortfolioItem}
        loading={saving}
      />

      {rawUserData?.role === "tasker" && targetUserId && (
        <CreateReviewModal
          isOpen={showCreateReviewModal}
          onClose={() => setShowCreateReviewModal(false)}
          onSuccess={() => {
            // Refresh reviews section
            window.location.reload();
          }}
          taskerId={targetUserId}
        />
      )}
    </div>
  );
};

export default Profile;
