import type { FC, ReactNode } from "react";

interface ProfileCardProps {
  title: string;
  description?: string;
  action?: ReactNode;
  children?: ReactNode;
}

const ProfileCard: FC<ProfileCardProps> = ({
  title,
  description,
  action,
  children,
}) => {
  return (
    <section className="rounded-xl border border-gray-200 bg-white shadow-sm sm:rounded-2xl">
      <header className="flex flex-col items-start gap-2 border-b border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-6 sm:py-4">
        <div className="space-y-1 min-w-0 flex-1">
          <h3 className="text-base font-semibold text-gray-900 sm:text-lg">
            {title}
          </h3>
          {description && (
            <p className="text-xs text-gray-500 sm:text-sm">{description}</p>
          )}
        </div>
        {action && <div className="w-full flex-shrink-0 sm:w-auto">{action}</div>}
      </header>
      <div className="px-4 py-4 sm:px-6 sm:py-6">{children}</div>
    </section>
  );
};

export default ProfileCard;

