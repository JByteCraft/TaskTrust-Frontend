import React, { useState, useEffect } from "react";
import { FiX, FiClock, FiBriefcase } from "react-icons/fi";
import { getSchedule, updateSchedule } from "../../../lib/api/schedule.api";
import { getMyApplications } from "../../../lib/api/applications.api";
import { getJob } from "../../../lib/api/jobs.api";
import Calendar from "../../../components/Calendar";

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: number;
}

const DAYS = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

const ScheduleModal: React.FC<ScheduleModalProps> = ({
  isOpen,
  onClose,
  userId,
}) => {
  const [schedule, setSchedule] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<Array<{ date: Date; count: number }>>([]);
  const [eventDetails, setEventDetails] = useState<Array<{
    date: Date;
    title: string;
    type: string;
    jobId?: number;
  }>>([]);

  useEffect(() => {
    if (isOpen && userId) {
      loadSchedule();
    }
  }, [isOpen, userId]);

  const loadSchedule = async () => {
    try {
      setLoading(true);
      const response = await getSchedule();
      const scheduleData =
        response?.response || response?.data?.response || response?.data || response;
      setSchedule(scheduleData);

      // Load events from accepted applications
      await loadEvents();
    } catch (error: any) {
      console.error("Load schedule error:", error);
      alert(error.response?.data?.message || "Failed to load schedule");
    } finally {
      setLoading(false);
    }
  };

  const loadEvents = async () => {
    try {
      // Get accepted applications
      // axios returns: { data: { status, response, message } }
      const appsResponse = await getMyApplications();
      let appsData: any[] = [];
      if (appsResponse?.data?.response && Array.isArray(appsResponse.data.response)) {
        appsData = appsResponse.data.response;
      } else if (Array.isArray(appsResponse?.data)) {
        appsData = appsResponse.data;
      }
      const acceptedApps = appsData.filter((app: any) => app.status === "accepted");

      // Get job details for each accepted application
      const eventList: Array<{ date: Date; title: string; type: string; jobId?: number }> = [];
      for (const app of acceptedApps) {
        try {
          const jobResponse = await getJob(app.jobId);
          // axios returns: { data: { status, response, message } }
          let jobData: any = null;
          if (jobResponse?.data?.response && typeof jobResponse.data.response === 'object') {
            jobData = jobResponse.data.response;
          } else if (jobResponse?.data && typeof jobResponse.data === 'object' && jobResponse.data.jobId) {
            jobData = jobResponse.data;
          }
          if (jobData) {
            // Use deadline if available, otherwise use created date
            const eventDate = jobData.deadline ? new Date(jobData.deadline) : new Date(jobData.createdAt);
            eventList.push({
              date: eventDate,
              title: jobData.title || `Job #${app.jobId}`,
              type: "job",
              jobId: app.jobId,
            });
          }
        } catch (err) {
          console.error(`Failed to fetch job ${app.jobId}:`, err);
        }
      }

      setEventDetails(eventList);

      // Group events by date for calendar
      const eventsMap = new Map<string, number>();
      eventList.forEach((event) => {
        const dateStr = event.date.toISOString().split("T")[0];
        eventsMap.set(dateStr, (eventsMap.get(dateStr) || 0) + 1);
      });

      const eventsArray = Array.from(eventsMap.entries()).map(([dateStr, count]) => ({
        date: new Date(dateStr),
        count,
      }));

      setEvents(eventsArray);
    } catch (error) {
      console.error("Load events error:", error);
    }
  };

  const handleDayChange = (day: string, field: string, value: any) => {
    if (!schedule) return;

    const updatedSchedule = { ...schedule };
    if (!updatedSchedule.weeklySchedule) {
      updatedSchedule.weeklySchedule = {};
    }

    if (!updatedSchedule.weeklySchedule[day]) {
      updatedSchedule.weeklySchedule[day] = {
        available: false,
        startTime: "09:00",
        endTime: "17:00",
      };
    }

    updatedSchedule.weeklySchedule[day] = {
      ...updatedSchedule.weeklySchedule[day],
      [field]: value,
    };

    setSchedule(updatedSchedule);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateSchedule(schedule?.weeklySchedule || {});
      alert("Schedule updated successfully!");
      onClose();
    } catch (error: any) {
      console.error("Save schedule error:", error);
      alert(error.response?.data?.message || "Failed to save schedule");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const weeklySchedule = schedule?.weeklySchedule || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-2xl max-h-[90vh] rounded-2xl bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 shrink-0">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FiClock className="w-5 h-5" />
            Manage Schedule
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            disabled={saving}
          >
            <FiX className="h-6 w-6" />
          </button>
        </div>

        <div className="px-6 py-6 overflow-y-auto flex-1 flex flex-col gap-6">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading schedule...</div>
          ) : (
            <>
              {/* Calendar Section */}
              <div className="shrink-0">
                <Calendar
                  currentDate={currentDate}
                  onDateChange={setCurrentDate}
                  events={events}
                />
              </div>

              {/* Events Lists Section */}
              <div className="flex-1 space-y-4 min-h-0">
                {/* Upcoming Events */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Upcoming</h3>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {eventDetails
                      .filter((event) => event.date >= new Date())
                      .sort((a, b) => a.date.getTime() - b.date.getTime())
                      .map((event, idx) => {
                        const daysLeft = Math.ceil(
                          (event.date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                        );
                        return (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                          >
                            <div className="flex items-center gap-3">
                              <FiBriefcase className="text-blue-600" />
                              <div>
                                <p className="font-medium text-gray-900">{event.title}</p>
                                <p className="text-sm text-gray-500">
                                  {event.date.toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <span className="text-sm font-medium text-blue-600">
                              {daysLeft} {daysLeft === 1 ? "day" : "days"} left
                            </span>
                          </div>
                        );
                      })}
                    {eventDetails.filter((event) => event.date >= new Date()).length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">No upcoming events</p>
                    )}
                  </div>
                </div>

                {/* Past Events */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Past</h3>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {eventDetails
                      .filter((event) => event.date < new Date())
                      .sort((a, b) => b.date.getTime() - a.date.getTime())
                      .map((event, idx) => {
                        const daysAgo = Math.floor(
                          (new Date().getTime() - event.date.getTime()) / (1000 * 60 * 60 * 24)
                        );
                        return (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 opacity-75"
                          >
                            <div className="flex items-center gap-3">
                              <FiBriefcase className="text-gray-400" />
                              <div>
                                <p className="font-medium text-gray-700">{event.title}</p>
                                <p className="text-sm text-gray-500">
                                  {event.date.toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <span className="text-sm font-medium text-gray-500">
                              {daysAgo} {daysAgo === 1 ? "day" : "days"} ago
                            </span>
                          </div>
                        );
                      })}
                    {eventDetails.filter((event) => event.date < new Date()).length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">No past events</p>
                    )}
                  </div>
                </div>

                {/* Weekly Schedule (Collapsible) */}
                <div className="border-t border-gray-200 pt-4">
                  <details className="group">
                    <summary className="cursor-pointer text-lg font-semibold text-gray-900 mb-3 list-none">
                      <div className="flex items-center justify-between">
                        <span>Weekly Availability</span>
                        <span className="text-sm font-normal text-gray-500 group-open:hidden">Click to expand</span>
                      </div>
                    </summary>
                    <div className="space-y-4 mt-4">
                      {DAYS.map((day) => {
                        const daySchedule = weeklySchedule[day.key] || {
                          available: false,
                          startTime: "09:00",
                          endTime: "17:00",
                        };

                        return (
                          <div
                            key={day.key}
                            className="border border-gray-200 rounded-lg p-4"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={daySchedule.available || false}
                                  onChange={(e) =>
                                    handleDayChange(day.key, "available", e.target.checked)
                                  }
                                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                  disabled={saving}
                                />
                                <span className="font-semibold text-gray-900">
                                  {day.label}
                                </span>
                              </label>
                            </div>

                            {daySchedule.available && (
                              <div className="grid grid-cols-2 gap-4 mt-3">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Start Time
                                  </label>
                                  <input
                                    type="time"
                                    value={daySchedule.startTime || "09:00"}
                                    onChange={(e) =>
                                      handleDayChange(day.key, "startTime", e.target.value)
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    disabled={saving}
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    End Time
                                  </label>
                                  <input
                                    type="time"
                                    value={daySchedule.endTime || "17:00"}
                                    onChange={(e) =>
                                      handleDayChange(day.key, "endTime", e.target.value)
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    disabled={saving}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </details>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading || saving}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Saving...
              </>
            ) : (
              "Save Schedule"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleModal;

