import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { resetPassword } from "../../lib/api/auth.api";
import { IoEyeOutline, IoEyeOffOutline } from "react-icons/io5";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{
    newPassword: string;
    confirmPassword: string;
  }>({ newPassword: "", confirmPassword: "" });
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!token) {
      setMessage("Invalid or missing reset token. Please request a new password reset.");
    }
  }, [token]);

  const validate = (currentNewPassword: string, currentConfirmPassword: string) => {
    const nextErrors = { newPassword: "", confirmPassword: "" };

    if (!currentNewPassword.trim()) {
      nextErrors.newPassword = "Password is required";
    } else if (currentNewPassword.length < 8) {
      nextErrors.newPassword = "Password must be at least 8 characters long";
    }

    if (!currentConfirmPassword.trim()) {
      nextErrors.confirmPassword = "Please confirm your password";
    } else if (currentNewPassword !== currentConfirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match";
    }

    return nextErrors;
  };

  const handleBlur = (field: "newPassword" | "confirmPassword") => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors(validate(newPassword, confirmPassword));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!token) {
      setMessage("Invalid reset token. Please request a new password reset.");
      return;
    }

    const validation = validate(newPassword, confirmPassword);
    setErrors(validation);
    setTouched({ newPassword: true, confirmPassword: true });

    if (validation.newPassword || validation.confirmPassword || loading) {
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await resetPassword(token, newPassword);
      const res = response?.data || response;

      if (res?.status === 200 || res?.message) {
        setSuccess(true);
        setMessage(
          res.message || "Password reset successfully. You can now login with your new password."
        );
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } else {
        setMessage(res?.error || "Failed to reset password. Please try again.");
      }
    } catch (error: any) {
      console.error("Reset password error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to reset password. The token may be invalid or expired.";
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const showNewPasswordError =
    !!errors.newPassword && (touched.newPassword || newPassword.length > 0);
  const showConfirmPasswordError =
    !!errors.confirmPassword &&
    (touched.confirmPassword || confirmPassword.length > 0);

  if (!token) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-200 via-white to-blue-200 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 md:p-10 max-w-md w-full">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-600"
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
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Reset Link</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <Link
              to="/forgot-password"
              className="inline-block bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition"
            >
              Request New Reset Link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-200 via-white to-blue-200 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-40 -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-40 translate-y-1/2 -translate-x-1/2"></div>
      </div>
      <div className="relative w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 md:p-10">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Reset Password</h2>
            <p className="text-gray-600 mt-2">
              {success
                ? "Your password has been reset successfully!"
                : "Enter your new password below"}
            </p>
          </div>

          {success ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">{message}</p>
                <p className="text-sm text-green-700 mt-2">
                  Redirecting to login page...
                </p>
              </div>
              <button
                onClick={() => navigate("/login")}
                className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition"
              >
                Go to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <div className="space-y-4">
                <div>
                  <label
                    className="block text-sm font-medium text-gray-700 mb-1"
                    htmlFor="new-password"
                  >
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      onBlur={() => handleBlur("newPassword")}
                      className={`w-full px-4 py-2 pr-10 border rounded-lg focus:ring-2 outline-none transition ${
                        showNewPasswordError
                          ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                          : "border-gray-300 focus:ring-blue-500 focus:border-transparent"
                      }`}
                      placeholder="Enter new password"
                      aria-invalid={showNewPasswordError}
                      aria-describedby={
                        showNewPasswordError ? "new-password-error" : undefined
                      }
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <IoEyeOffOutline className="w-5 h-5" />
                      ) : (
                        <IoEyeOutline className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {showNewPasswordError && (
                    <p
                      id="new-password-error"
                      className="mt-1 text-sm text-red-600"
                      role="alert"
                    >
                      {errors.newPassword}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    className="block text-sm font-medium text-gray-700 mb-1"
                    htmlFor="confirm-password"
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      onBlur={() => handleBlur("confirmPassword")}
                      className={`w-full px-4 py-2 pr-10 border rounded-lg focus:ring-2 outline-none transition ${
                        showConfirmPasswordError
                          ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                          : "border-gray-300 focus:ring-blue-500 focus:border-transparent"
                      }`}
                      placeholder="Confirm new password"
                      aria-invalid={showConfirmPasswordError}
                      aria-describedby={
                        showConfirmPasswordError
                          ? "confirm-password-error"
                          : undefined
                      }
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
                      aria-label={
                        showConfirmPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showConfirmPassword ? (
                        <IoEyeOffOutline className="w-5 h-5" />
                      ) : (
                        <IoEyeOutline className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {showConfirmPasswordError && (
                    <p
                      id="confirm-password-error"
                      className="mt-1 text-sm text-red-600"
                      role="alert"
                    >
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
                {message && (
                  <p
                    className={`text-sm ${
                      message.toLowerCase().includes("success")
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {message}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? "Resetting..." : "Reset Password"}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Remember your password?{" "}
              <Link
                to="/login"
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;

