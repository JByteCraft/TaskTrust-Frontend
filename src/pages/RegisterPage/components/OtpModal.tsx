// src/pages/RegisterPage/components/OtpModal.tsx
import React from "react";

interface OTPModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  otp: string;
  setOtp: (value: string) => void;
  onVerify: () => void;
  onResend: () => void;
  loading?: boolean;
  message?: string;
}

const OTPModal: React.FC<OTPModalProps> = ({
  isOpen,
  onClose,
  email,
  otp,
  setOtp,
  onVerify,
  onResend,
  loading = false,
  message = "",
}) => {
  if (!isOpen) {
    console.log("ℹ️ OTPModal not open");
    return null;
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    console.log(`✏️ OTP input[${index}] changed:`, value);
    if (!value) return;

    const otpArray = otp.padEnd(6, "0").split("");
    otpArray[index] = value;
    const newOtp = otpArray.join("").slice(0, 6);
    console.log("🔢 New OTP value:", newOtp);
    setOtp(newOtp);

    const nextInput = document.getElementById(`otp-${index + 1}`);
    if (nextInput) (nextInput as HTMLInputElement).focus();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full border border-gray-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
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
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            Verify Your Email
          </h2>
          <p className="text-gray-600 mt-2">
            We've sent a 6-digit code to your email
          </p>
          <p className="text-sm text-blue-600 font-medium mt-1">{email}</p>
          {message && <p className="text-sm text-red-500 mt-2">{message}</p>}
        </div>
        <div className="flex justify-center gap-3 mb-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <input
              key={index}
              id={`otp-${index}`}
              type="text"
              maxLength={1}
              value={otp[index] || ""}
              onChange={(e) => handleInputChange(e, index)}
              className="w-12 h-12 text-center text-xl font-bold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
              placeholder="0"
            />
          ))}
        </div>
        <button
          onClick={onVerify}
          disabled={loading || otp.length < 6}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition mb-4 disabled:opacity-50"
        >
          {loading ? "Verifying..." : "Verify Code"}
        </button>
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Didn't receive the code?{" "}
            <button
              onClick={onResend}
              disabled={loading}
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              Resend
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default OTPModal;
