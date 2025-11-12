import type { FC } from "react";
import {
  FiEdit2,
  FiPlus,
  FiUser,
  FiUsers,
  FiCheckCircle,
  FiStar,
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
  onAddPost?: () => void;
  onEditProfile?: () => void;
  onUploadAvatar?: () => void;
}

const ProfileHero: FC<ProfileHeroProps> = ({
  name,
  role,
  stats,
  avatarUrl,
  coverUrl,
  onAddPost,
  onEditProfile,
  onUploadAvatar,
}) => {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");

  const heroCoverStyle = coverUrl
    ? { backgroundImage: `url(${coverUrl})` }
    : undefined;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm sm:rounded-3xl">
      <div
        className="h-28 w-full bg-gradient-to-r from-blue-100 via-blue-50 to-white sm:h-32 lg:h-36"
        style={heroCoverStyle}
      />
      <div className="px-3 pb-4 sm:px-4 sm:pb-6 lg:px-8">
        <div className="-mt-12 flex flex-col gap-4 sm:-mt-14 sm:gap-6 lg:-mt-16 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:items-end sm:gap-4 sm:text-left">
            <div className="flex items-center justify-center flex-shrink-0 relative group">
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
            <div className="pb-1 sm:pb-2 min-w-0 flex-1">
              <h1 className="text-xl font-semibold text-gray-900 break-words sm:text-2xl lg:text-3xl">
                {name}
              </h1>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-blue-600 sm:text-xs lg:text-sm">
                {role}
              </p>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-[11px] font-medium text-gray-600 sm:mt-4 sm:justify-start sm:gap-4 sm:text-xs lg:text-sm">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <FiUsers className="h-3.5 w-3.5 text-blue-500 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="whitespace-nowrap">
                    {(stats?.connections ?? 0).toLocaleString()} Connections
                  </span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <FiCheckCircle className="h-3.5 w-3.5 text-blue-500 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="whitespace-nowrap">{stats?.tasksCompleted ?? 0} Task Completed</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <FiStar className="h-3.5 w-3.5 text-blue-500 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="whitespace-nowrap">
                    {(stats?.rating ?? 0).toFixed(1)}/5 Ratings (
                    {stats?.reviews ?? 0})
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex w-full flex-col gap-2 pb-1 sm:w-auto sm:flex-row sm:justify-center lg:justify-end">
            <button
              type="button"
              onClick={onAddPost}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 active:bg-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 sm:w-auto sm:px-5 sm:text-sm"
            >
              <FiPlus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Add Post
            </button>
            <button
              type="button"
              onClick={onEditProfile}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 px-4 py-2.5 text-xs font-semibold text-gray-700 transition hover:border-blue-300 hover:text-blue-600 active:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 sm:w-auto sm:px-5 sm:text-sm"
            >
              <FiEdit2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Edit Profile
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProfileHero;

