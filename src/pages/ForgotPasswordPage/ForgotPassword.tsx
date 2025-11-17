import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { forgotPassword, verifyOtpPasswordReset } from "../../lib/api/auth.api";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<{ email: string; otp: string }>({ email: "", otp: "" });
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validate = (currentEmail: string, currentOtp?: string) => {
    const nextErrors: { email: string; otp: string } = { email: "", otp: "" };
    if (!currentEmail.trim()) {
      nextErrors.email = "Email is required";
    } else if (!emailRegex.test(currentEmail)) {
      nextErrors.email = "Invalid email address";
    }
    if (currentOtp !== undefined) {
      if (!currentOtp.trim()) {
        nextErrors.otp = "OTP is required";
      } else if (!/^\d{6}$/.test(currentOtp.trim())) {
        nextErrors.otp = "OTP must be 6 digits";
      }
    }
    return nextErrors;
  };

  const handleBlur = (field: "email" | "otp") => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    if (field === "email") {
      setErrors(validate(email));
    } else {
      setErrors(validate(email, otp));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (step === "email") {
      const validation = validate(email);
      setErrors(validation);
      setTouched({ email: true });

      if (validation.email || loading) {
        return;
      }

      setLoading(true);
      setMessage("");

      try {
        const response = await forgotPassword(email);
        const res = response?.data || response;

        if (res?.status === 200 || res?.message) {
          setStep("otp");
          setMessage(
            res.message ||
              "If the email exists, an OTP has been sent to your email."
          );
        } else {
          setMessage(
            res?.error || "Failed to send OTP. Please try again."
          );
        }
      } catch (error: any) {
        console.error("Forgot password error:", error);
        const errorMessage =
          error?.response?.data?.message ||
          error?.message ||
          "Failed to send OTP. Please try again.";
        setMessage(errorMessage);
      } finally {
        setLoading(false);
      }
    } else {
      // OTP verification step
      const validation = validate(email, otp);
      setErrors(validation);
      setTouched({ email: true, otp: true });

      if (validation.email || validation.otp || loading) {
        return;
      }

      setLoading(true);
      setMessage("");

      try {
        const response = await verifyOtpPasswordReset(email, otp.trim());
        const res = response?.data || response;

        if (res?.status === 200 && res?.response?.resetToken) {
          // Navigate to reset password page with token
          navigate(`/reset-password?token=${res.response.resetToken}`);
        } else {
          setMessage(
            res?.message || res?.error || "Invalid OTP. Please try again."
          );
        }
      } catch (error: any) {
        console.error("Verify OTP error:", error);
        const errorMessage =
          error?.response?.data?.message ||
          error?.message ||
          "Invalid OTP. Please try again.";
        setMessage(errorMessage);
      } finally {
        setLoading(false);
      }
    }
  };

  const showEmailError = !!errors.email && (touched.email || email.length > 0);
  const showOtpError = !!errors.otp && (touched.otp || otp.length > 0);

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-200 via-white to-blue-200 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-40 -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-40 translate-y-1/2 -translate-x-1/2"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-30 -translate-x-1/2 -translate-y-1/2"></div>
      </div>
      <div className="relative w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 md:p-10">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Forgot Password</h2>
            <p className="text-gray-600 mt-2">
              {step === "otp"
                ? "Enter the OTP sent to your email"
                : "Enter your email address and we'll send you an OTP to reset your password"}
            </p>
          </div>

          {success ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">{message}</p>
              </div>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => navigate("/login")}
                  className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition"
                >
                  Back to Login
                </button>
                <button
                  onClick={() => {
                    setSuccess(false);
                    setEmail("");
                    setMessage("");
                  }}
                  className="w-full bg-gray-100 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition"
                >
                  Send Another Email
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <div className="space-y-4">
                {step === "email" ? (
                  <>
                    <div>
                      <label
                        className="block text-sm font-medium text-gray-700 mb-1"
                        htmlFor="forgot-email"
                      >
                        Email
                      </label>
                      <input
                        id="forgot-email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        onBlur={() => handleBlur("email")}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 outline-none transition ${
                          showEmailError
                            ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                            : "border-gray-300 focus:ring-blue-500 focus:border-transparent"
                        }`}
                        placeholder="your@email.com"
                        aria-invalid={showEmailError}
                        aria-describedby={showEmailError ? "forgot-email-error" : undefined}
                      />
                      {showEmailError && (
                        <p
                          id="forgot-email-error"
                          className="mt-1 text-sm text-red-600"
                          role="alert"
                        >
                          {errors.email}
                        </p>
                      )}
                    </div>
                    {message && (
                      <p
                        className={`text-sm ${
                          message.toLowerCase().includes("success") ||
                          message.toLowerCase().includes("sent") ||
                          message.toLowerCase().includes("otp")
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
                      {loading ? "Sending..." : "Send OTP"}
                    </button>
                  </>
                ) : (
                  <>
                    <div>
                      <label
                        className="block text-sm font-medium text-gray-700 mb-1"
                        htmlFor="forgot-otp"
                      >
                        OTP Code
                      </label>
                      <input
                        id="forgot-otp"
                        type="text"
                        value={otp}
                        onChange={(event) => {
                          const value = event.target.value.replace(/\D/g, "").slice(0, 6);
                          setOtp(value);
                        }}
                        onBlur={() => handleBlur("otp")}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 outline-none transition text-center text-2xl tracking-widest ${
                          showOtpError
                            ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                            : "border-gray-300 focus:ring-blue-500 focus:border-transparent"
                        }`}
                        placeholder="000000"
                        maxLength={6}
                        aria-invalid={showOtpError}
                        aria-describedby={showOtpError ? "forgot-otp-error" : undefined}
                      />
                      {showOtpError && (
                        <p
                          id="forgot-otp-error"
                          className="mt-1 text-sm text-red-600"
                          role="alert"
                        >
                          {errors.otp}
                        </p>
                      )}
                      <p className="mt-2 text-xs text-gray-500 text-center">
                        Enter the 6-digit code sent to {email}
                      </p>
                    </div>
                    {message && (
                      <p
                        className={`text-sm ${
                          message.toLowerCase().includes("success") ||
                          message.toLowerCase().includes("verified")
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {message}
                      </p>
                    )}
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setStep("email");
                          setOtp("");
                          setMessage("");
                          setErrors({ email: "", otp: "" });
                        }}
                        className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {loading ? "Verifying..." : "Verify OTP"}
                      </button>
                    </div>
                  </>
                )}
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

export default ForgotPassword;

