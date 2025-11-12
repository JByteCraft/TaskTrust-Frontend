import type { FC } from "react";

interface Tab {
  id: string;
  label: string;
}

interface ProfileTabsProps {
  tabs: string[] | Tab[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const ProfileTabs: FC<ProfileTabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
}) => {
  return (
    <nav className="mt-4 overflow-x-auto border-b border-gray-200 sm:mt-6 scrollbar-hide">
      <div className="flex min-w-max items-center gap-3 px-1 text-xs font-semibold sm:gap-4 sm:px-2 sm:text-sm lg:gap-6">
        {tabs.map((tab) => {
          const tabId = typeof tab === "string" ? tab : tab.id;
          const tabLabel = typeof tab === "string" ? tab : tab.label;
          const isActive = tabId === activeTab;
          return (
            <button
              key={tabId}
              type="button"
              onClick={() => onTabChange(tabId)}
              className={`whitespace-nowrap border-b-2 pb-2.5 px-1 transition active:bg-blue-50 sm:pb-3 sm:px-2 ${
                isActive
                  ? "border-blue-500 text-blue-600 font-semibold"
                  : "border-transparent text-gray-500 hover:border-blue-200 hover:text-blue-500"
              }`}
            >
              {tabLabel}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default ProfileTabs;

