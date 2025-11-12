import React from "react";
import { IoCheckmarkCircleOutline } from "react-icons/io5";

interface CreatedUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue?: () => void;
  email?: string;
  message?: string;
}

const CreatedUserModal: React.FC<CreatedUserModalProps> = ({
  isOpen,
  onClose,
  onContinue,
  email,
  message,
}) => {
  if (!isOpen) {
    return null;
  }

  const handleContinue = () => {
    if (onContinue) {
      onContinue();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
        role="presentation"
      ></div>
      <div
        role="dialog"
        aria-modal="true"
        className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full border border-gray-100"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
          aria-label="Close"
          title="Close"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <IoCheckmarkCircleOutline className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Account Created!</h2>
          <p className="text-gray-600 mt-2">
            {message ??
              "Your account is now active. You can sign in to start using TaskTrust."}
          </p>
          {email && (
            <p className="text-sm text-blue-600 font-medium mt-2">{email}</p>
          )}
        </div>
        <button
          type="button"
          onClick={handleContinue}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition"
        >
          Continue to Login
        </button>
      </div>
    </div>
  );
};

export default CreatedUserModal;
