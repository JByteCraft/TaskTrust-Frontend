import { useEffect, useMemo, useState } from "react";
import ProfileHero, {
  type ProfileStats,
} from "./components/ProfileHero";
import ProfileTabs from "./components/ProfileTabs";
import ProfileCard from "./components/ProfileCard";
import EditProfileModal from "./components/EditProfileModal";
import UploadAvatarModal from "./components/UploadAvatarModal";
import { GET, PATCH } from "../../lib/utils/fetch.utils";
import {
  getAuthenticatedUserFromToken,
  getStoredAuthToken,
} from "../../lib/utils/auth.utils";

type ProfileData = {
  name: string;
  role: string;
  avatarUrl?: string;
  coverUrl?: string;
  stats: ProfileStats;
  bio?: string;
};

const TABS = ["Main", "About", "Portfolio", "Tasker Reviews", "Schedule"];

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
  const [profile, setProfile] = useState<ProfileData>(DEFAULT_PROFILE);
  const [rawUserData, setRawUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("posts");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchProfile = async () => {
      const token = getStoredAuthToken();
      if (!token) {
        setError("No active session found. Please log in again.");
        setLoading(false);
        return;
      }

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

      const resolvedUserId =
        authPayload?.userId ??
        authPayload?.id ??
        (typeof authPayload?.sub === "string"
          ? Number(authPayload?.sub)
          : authPayload?.sub);

      if (!resolvedUserId || Number.isNaN(Number(resolvedUserId))) {
        setError("Unable to identify the current user. Please sign in again.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await GET<any>(
          `/users/${resolvedUserId}`,
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

        const payload =
          response?.data ||
          response?.profile ||
          response?.user ||
          response?.response ||
          response ||
          {};

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
  }, []);

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
      const dataToSend = {
        ...updatedData,
        profilePictureUrl: updatedData.profilePictureUrl || rawUserData?.profilePictureUrl || ""
      };
      
      const response = await PATCH<any>(
        `/users/${resolvedUserId}`,
        "",
        dataToSend,
        token || undefined
      );

      if (response?.status === 200 || response?.data || response?.user) {
        // Close modal and reload profile data
        setShowEditModal(false);
        
        // Refetch profile to ensure all data is up-to-date
        await fetchProfile();
      }
    } catch (err: any) {
      console.error("Update profile error:", err);
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

  const formattedRole = useMemo(() => {
    const role = profile.role || DEFAULT_PROFILE.role;
    return role.charAt(0).toUpperCase() + role.slice(1);
  }, [profile.role]);

  return (
    <div className="min-h-screen bg-slate-100 pb-8 sm:pb-12 lg:pb-16">
      <div className="h-40 w-full bg-linear-to-r from-blue-200 via-white to-blue-100 sm:h-44 lg:h-52" />
      <div className="-mt-20 space-y-4 px-2 sm:-mt-24 sm:space-y-6 sm:px-3 lg:-mt-32 lg:px-4">
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
              onEditProfile={() => setShowEditModal(true)}
              onUploadAvatar={() => setShowUploadModal(true)}
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
                </div>

                {/* Schedule */}
                <div className={activeTab === "schedule" ? "block" : activeTab === "posts" ? "hidden lg:block" : "hidden"}>
                  <ProfileCard
                    title="Schedule"
                    description="Your availability"
                    action={
                      <button
                        type="button"
                        className="rounded-full border border-blue-200 px-3 py-1 text-xs font-medium text-blue-600 transition hover:border-blue-300 hover:bg-blue-50"
                      >
                        Manage
                      </button>
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
                    description="Your recent work"
                    action={
                      <button
                        type="button"
                        className="rounded-full border border-blue-200 px-3 py-1 text-xs font-medium text-blue-600 transition hover:border-blue-300 hover:bg-blue-50"
                      >
                        Add item
                      </button>
                    }
                  >
                    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-center text-sm text-gray-500">
                      No portfolio items yet
                    </div>
                  </ProfileCard>
                </div>

                {/* Tasker Reviews */}
                <div className={activeTab === "reviews" ? "block" : activeTab === "posts" ? "hidden lg:block" : "hidden"}>
                  <ProfileCard
                    title="Tasker Reviews"
                    description="Client feedback"
                  >
                    <div className="space-y-3">
                      <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-center text-sm text-gray-400">
                        No reviews yet
                      </div>
                    </div>
                  </ProfileCard>
                </div>
                </div>

                {/* Right Content Area - 70% (Posts Feed) */}
                <div className={`lg:col-span-8 ${activeTab === "posts" ? "block" : "hidden lg:block"}`}>
                {/* Create Post Box */}
                <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-200">
                      {profile.avatarUrl ? (
                        <img
                          src={profile.avatarUrl}
                          alt={profile.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-semibold text-blue-700">
                          {profile.name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      className="flex-1 rounded-full border border-gray-300 bg-gray-50 px-4 py-2.5 text-left text-sm text-gray-500 transition hover:bg-gray-100"
                    >
                      What&apos;s on your mind, {profile.name.split(" ")[0]}?
                    </button>
                  </div>
                </div>

                {/* Posts Feed */}
                <div className="space-y-4">
                  {/* Empty State */}
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
                      Posts you create will appear here
                    </p>
                  </div>
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
            profession: rawUserData.profession || "",
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
    </div>
  );
};

export default Profile;
