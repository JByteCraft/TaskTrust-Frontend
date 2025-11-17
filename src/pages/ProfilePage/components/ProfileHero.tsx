import type { FC } from "react";
import {
  FiEdit2,
  FiPlus,
  FiUser,
  FiUsers,
  FiCheckCircle,
  FiStar,
  FiCamera,
  FiFileText,
} from "react-icons/fi";

export type ProfileStats = {
  connections?: number;
  tasksCompleted?: number;
  rating?: number;
  reviews?: number;
};

interface ProfileHeroProps {
  name: string;
  role: string;
  stats?: ProfileStats;
  avatarUrl?: string;
  coverUrl?: string;
  isLegit?: boolean;
  onAddPost?: () => void;
  onEditProfile?: () => void;
  onUploadAvatar?: () => void;
  onUploadCover?: () => void;
  onGenerateResume?: () => void;
}

const ProfileHero: FC<ProfileHeroProps> = ({
  name,
  role,
  stats,
  avatarUrl,
  coverUrl,
  isLegit,
  onAddPost,
  onEditProfile,
  onUploadAvatar,
  onUploadCover,
  onGenerateResume,
}) => {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");

  return (
    <section className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm sm:rounded-3xl">
      <div className="relative h-40 w-full bg-linear-to-r from-blue-100 via-blue-50 to-white sm:h-60 lg:h-96 group/cover overflow-hidden">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt="Cover"
            className="h-full w-full object-cover"
          />
        ) : null}
        {onUploadCover && (
          <button
            type="button"
            onClick={onUploadCover}
            className="absolute top-2 right-2 flex items-center gap-2 rounded-lg bg-black/50 px-3 py-2 text-xs font-medium text-white opacity-0 transition hover:bg-black/70 group-hover/cover:opacity-100 sm:px-4 sm:text-sm z-10"
            title="Change cover photo"
            aria-label="Change cover photo"
          >
            <FiCamera className="h-4 w-4" />
            <span className="hidden sm:inline">Edit Cover</span>
          </button>
        )}
      </div>
      <div className="px-3 pb-3 sm:px-4 sm:pb-4 lg:px-8 relative z-10 bg-white">
        <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-end lg:justify-between pt-2 sm:pt-3 lg:pt-3">
          <div className="flex flex-col items-center gap-2 text-center sm:flex-row sm:items-end sm:gap-3 sm:text-left w-full">
            <div className="flex items-center justify-center shrink-0 relative group z-20 -mt-12 sm:-mt-14 lg:-mt-16">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-white shadow-lg sm:h-28 sm:w-28 lg:h-32 lg:w-32">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={name}
                    className="h-full w-full object-cover"
                  />
                ) : initials ? (
                  <span className="text-2xl font-semibold text-blue-600 sm:text-3xl">
                    {initials}
                  </span>
                ) : (
                  <FiUser className="h-10 w-10 text-blue-500 sm:h-12 sm:w-12" />
                )}
              </div>
              {onUploadAvatar && (
                <button
                  type="button"
                  onClick={onUploadAvatar}
                  className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition hover:bg-blue-700 sm:h-9 sm:w-9"
                  title="Change profile picture"
                  aria-label="Change profile picture"
                >
                  <FiEdit2 className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="pb-1 sm:pb-2 min-w-0 flex-1 w-full relative z-10">
              <h1 className="text-xl font-semibold text-gray-900 wrap-break-word sm:text-2xl lg:text-3xl flex items-center justify-center gap-2 flex-wrap sm:justify-start">
                <span className="wrap-break-word min-w-0">{name}</span>
                {isLegit && (
                  <span
                    className="inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-600 text-white shrink-0"
                    title="Verified User"
                  >
                    <FiCheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </span>
                )}
              </h1>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-blue-600 sm:text-xs lg:text-sm wrap-break-word text-center sm:text-left">
                {role}
              </p>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-[11px] font-medium text-gray-600 sm:mt-4 sm:justify-start sm:gap-4 sm:text-xs lg:text-sm">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <FiUsers className="h-3.5 w-3.5 text-blue-500 sm:h-4 sm:w-4 shrink-0" />
                  <span className="whitespace-nowrap">
                    {(stats?.connections ?? 0).toLocaleString()} Connections
                  </span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <FiCheckCircle className="h-3.5 w-3.5 text-blue-500 sm:h-4 sm:w-4 shrink-0" />
                  <span className="whitespace-nowrap">{stats?.tasksCompleted ?? 0} Task Completed</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <FiStar className="h-3.5 w-3.5 text-blue-500 sm:h-4 sm:w-4 shrink-0" />
                  <span className="whitespace-nowrap">
                    {(stats?.rating ?? 0).toFixed(1)}/5 Ratings (
                    {stats?.reviews ?? 0})
                  </span>
                </div>
              </div>
            </div>
          </div>
          {(onAddPost || onEditProfile || onGenerateResume) && (
            <div className="flex w-full flex-col gap-2 pb-1 sm:w-auto sm:flex-row sm:justify-center lg:justify-end">
              {onAddPost && (
                <button
                  type="button"
                  onClick={onAddPost}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 active:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 sm:w-auto sm:px-5 sm:text-sm"
                >
                  <FiPlus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Add Post
                </button>
              )}
              {onEditProfile && (
                <button
                  type="button"
                  onClick={onEditProfile}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 px-4 py-2.5 text-xs font-semibold text-gray-700 transition hover:border-blue-300 hover:text-blue-600 active:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 sm:w-auto sm:px-5 sm:text-sm"
                >
                  <FiEdit2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Edit Profile
                </button>
              )}
              {onGenerateResume && (
                <button
                  type="button"
                  onClick={onGenerateResume}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-green-300 bg-green-50 px-4 py-2.5 text-xs font-semibold text-green-700 transition hover:border-green-400 hover:bg-green-100 active:bg-green-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-400 sm:w-auto sm:px-5 sm:text-sm"
                >
                  <FiFileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Generate Resume
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ProfileHero;

