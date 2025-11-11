// src/pages/RegisterPage/Register.tsx
import { useState } from "react";
import RegisterForm from "./components/RegisterForm";
import OTPModal from "./components/OtpModal";
import { POST } from "../../lib/utils/fetch.utils";

const Register = () => {
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState("");
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleRegister = async (data: any) => {
    console.log("▶️ handleRegister called with:", data);
    setLoading(true);
    setMessage("");
    try {
      setEmail(data.email);
      setFormData(data);

      console.log("📤 Sending register request:", data);
      const res = await POST("/auth/register", data);
      console.log("📥 Register response:", res);

      if (
        res.status === 200 ||
        res.status === 201 ||
        res.statusCode === 200 ||
        res.statusCode === 201
      ) {
        console.log("✅ OTP modal should open now");
        setMessage(res.message || "OTP sent to your email");
        setShowOTP(true);
      } else {
        console.log("❌ Registration failed:", res.message);
        setMessage(res.message || "Registration failed");
      }
    } catch (err: any) {
      console.error("💥 Register error:", err);
      setMessage(err?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await POST("/auth/verify-otp-register", {
        email,
        otp,
        userData: formData,
      });
      console.log("📥 Verify OTP response:", res);

      if (res.status === 200 || res.status === 201) {
        setMessage(res.message || "Account verified!");
        setShowOTP(false);
        alert("Account verified! Redirecting to login...");
        window.location.href = "/login";
      } else {
        setMessage(res.message || "OTP verification failed");
      }
    } catch (err: any) {
      console.error("💥 Verify OTP error:", err);
      setMessage(err?.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await POST("/auth/resend-otp-register", { email });
      console.log("📥 Resend OTP response:", res);

      setMessage(res.message || "OTP resent!");
    } catch (err: any) {
      console.error("💥 Resend OTP error:", err);
      setMessage(err?.message || "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-200 via-white to-blue-200 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="relative w-full max-w-6xl mx-auto grid md:grid-cols-2 gap-8 items-center">
        <div className="hidden md:block space-y-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <svg
                  className="w-7 h-7 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">TaskTrust</h2>
                <p className="text-sm text-blue-600 font-medium">
                  Task Management Made Easy
                </p>
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 pt-4">
              Join TaskTrust Today
            </h1>
            <p className="text-lg text-gray-600">
              Create your account and start managing your tasks efficiently with
              our powerful platform.
            </p>
          </div>
          <div className="space-y-4 pt-8">
            {["Free Forever", "Easy Setup", "Secure & Private"].map(
              (title, idx) => (
                <div key={idx} className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <svg
                      className="w-4 h-4 text-blue-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{title}</h3>
                    <p className="text-sm text-gray-600">
                      {title === "Free Forever"
                        ? "Start using TaskTrust at no cost"
                        : title === "Easy Setup"
                        ? "Get started in less than 2 minutes"
                        : "Your data is encrypted and protected"}
                    </p>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
        <div className="w-full">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 md:p-10">
            <RegisterForm onShowOTP={handleRegister} />
          </div>
        </div>
      </div>
      <OTPModal
        isOpen={showOTP}
        onClose={() => setShowOTP(false)}
        email={email}
        otp={otp}
        setOtp={setOtp}
        onVerify={handleVerifyOtp}
        onResend={handleResendOtp}
        loading={loading}
        message={message}
      />
    </div>
  );
};

export default Register;
