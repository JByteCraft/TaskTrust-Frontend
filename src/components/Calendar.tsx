import React from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

interface CalendarProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  events: Array<{ date: Date; count: number }>;
  onDateClick?: (date: Date) => void;
}

const Calendar: React.FC<CalendarProps> = ({
  currentDate,
  onDateChange,
  events,
  onDateClick,
}) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const goToPreviousMonth = () => {
    onDateChange(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    onDateChange(new Date(year, month + 1, 1));
  };

  const getEventCountForDate = (date: Date): number => {
    const dateStr = date.toISOString().split("T")[0];
    const event = events.find(
      (e) => e.date.toISOString().split("T")[0] === dateStr
    );
    return event?.count || 0;
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(year, month, day);
    if (onDateClick) {
      onDateClick(clickedDate);
    }
  };

  return (
    <div className="bg-white rounded-lg p-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={goToPreviousMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <FiChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="text-lg font-semibold text-gray-900">
          {monthNames[month]} {year}
        </h2>
        <button
          type="button"
          onClick={goToNextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <FiChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Day Names */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-gray-500 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Days */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells for days before month starts */}
        {Array.from({ length: startingDayOfWeek }).map((_, index) => (
          <div key={`empty-${index}`} className="aspect-square" />
        ))}

        {/* Days of the month */}
        {Array.from({ length: daysInMonth }).map((_, index) => {
          const day = index + 1;
          const date = new Date(year, month, day);
          const eventCount = getEventCountForDate(date);
          const today = isToday(date);

          return (
            <button
              key={day}
              type="button"
              onClick={() => handleDateClick(day)}
              className={`aspect-square rounded-lg text-sm font-medium transition relative ${
                today
                  ? "bg-blue-600 text-white"
                  : eventCount > 0
                  ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {day}
              {eventCount > 0 && (
                <span className="absolute bottom-1 left-1/2 transform -translate-x-1/2 text-xs">
                  {eventCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;

