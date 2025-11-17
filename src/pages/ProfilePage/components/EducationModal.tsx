import React, { useState, useEffect } from "react";
import { FiX, FiCalendar, FiBook } from "react-icons/fi";
import { createEducationRecord, updateEducationRecord } from "../../../lib/api/education.api";

interface EducationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => Promise<void>;
  initialData?: any;
  loading?: boolean;
}

const EducationModal: React.FC<EducationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  loading = false,
}) => {
  const [institution, setInstitution] = useState(initialData?.institution || "");
  const [degree, setDegree] = useState(initialData?.degree || "");
  const [startDate, setStartDate] = useState(
    initialData?.startDate ? new Date(initialData.startDate).toISOString().split("T")[0] : ""
  );
  const [endDate, setEndDate] = useState(
    initialData?.endDate ? new Date(initialData.endDate).toISOString().split("T")[0] : ""
  );
  const [isCurrentlyStudying, setIsCurrentlyStudying] = useState(initialData?.isCurrentlyStudying || false);

  useEffect(() => {
    if (initialData) {
      setInstitution(initialData.institution || "");
      setDegree(initialData.degree || "");
      setStartDate(
        initialData.startDate ? new Date(initialData.startDate).toISOString().split("T")[0] : ""
      );
      setEndDate(
        initialData.endDate ? new Date(initialData.endDate).toISOString().split("T")[0] : ""
      );
      setIsCurrentlyStudying(initialData.isCurrentlyStudying || false);
    } else {
      // Reset to defaults
      setInstitution("");
      setDegree("");
      setStartDate("");
      setEndDate("");
      setIsCurrentlyStudying(false);
    }
  }, [initialData, isOpen]);

  const handleSubmit = async () => {
    if (!institution.trim() || !degree.trim()) {
      alert("Institution and degree are required");
      return;
    }

    const data: any = {
      institution: institution.trim(),
      degree: degree.trim(),
      startDate: startDate || undefined,
      endDate: isCurrentlyStudying ? undefined : (endDate || undefined),
      isCurrentlyStudying,
    };

    try {
      if (initialData?.educationId) {
        await updateEducationRecord(initialData.educationId, data);
      } else {
        await createEducationRecord(data);
      }
      await onSave();
      
      // Clear fields
      setInstitution("");
      setDegree("");
      setStartDate("");
      setEndDate("");
      setIsCurrentlyStudying(false);
    } catch (error: any) {
      console.error("Save education error:", error);
      alert(error.response?.data?.message || "Failed to save education record");
    }
  };

  const handleClose = () => {
    if (!loading) {
      setInstitution("");
      setDegree("");
      setStartDate("");
      setEndDate("");
      setIsCurrentlyStudying(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="absolute inset-0" onClick={handleClose} aria-hidden="true" />
      <div className="relative w-full max-w-2xl max-h-[90vh] rounded-2xl bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 shrink-0">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FiBook className="w-5 h-5" />
            {initialData ? "Edit Education" : "Add Education"}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            disabled={loading}
          >
            <FiX className="h-6 w-6" />
          </button>
        </div>

        <div className="px-6 py-6 overflow-y-auto flex-1 space-y-4">
          {/* Institution */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Institution <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., University of the Philippines"
              disabled={loading}
            />
          </div>

          {/* Degree */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Degree/Course <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={degree}
              onChange={(e) => setDegree(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Bachelor of Science in Computer Science"
              disabled={loading}
            />
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FiCalendar className="inline w-4 h-4 mr-1" />
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>

          {/* Currently Studying */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isCurrentlyStudying}
                onChange={(e) => setIsCurrentlyStudying(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                disabled={loading}
              />
              <span className="text-sm font-medium text-gray-700">
                I am currently studying here
              </span>
            </label>
          </div>

          {/* End Date */}
          {!isCurrentlyStudying && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FiCalendar className="inline w-4 h-4 mr-1" />
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>
          )}

        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4 shrink-0">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!institution.trim() || !degree.trim() || loading}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Saving...
              </>
            ) : (
              "Save"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EducationModal;

