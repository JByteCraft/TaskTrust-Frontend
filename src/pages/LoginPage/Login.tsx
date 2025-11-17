import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LoginForm from "./components/LoginForm";
import { POST } from "../../lib/utils/fetch.utils";
import {
  getStoredAuthToken,
  persistAuthToken,
} from "../../lib/utils/auth.utils";

type LoginPayload = {
  email: string;
  password: string;
  rememberMe: boolean;
};

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (getStoredAuthToken()) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  const extractToken = (response: any) => {
    if (!response || typeof response !== "object") return "";
    return (
      response.token ||
      response.accessToken ||
      response.data?.token ||
      response.data?.accessToken ||
      response.response?.token ||
      response.response?.accessToken ||
      response.response?.data?.token ||
      response.response?.data?.accessToken ||
      ""
    );
  };

  const handleLogin = async ({ email, password, rememberMe }: LoginPayload) => {
    setLoading(true);
    setMessage("");
    try {
      console.log("Attempting login for:", email);
      const res = await POST("/auth/login", "", { email, password });
      console.log("Login response:", res);

      // Check if response indicates success
      const isSuccess =
        res?.status === 200 ||
        res?.status === 201 ||
        res?.success === true ||
        !!res?.token ||
        !!res?.accessToken ||
        !!res?.data?.token ||
        !!res?.data?.accessToken ||
        !!res?.response?.token ||
        !!res?.response?.accessToken;

      if (!isSuccess) {
        const errorMessage = res?.message || res?.error || "Login failed. Please try again.";
        console.error("Login failed:", errorMessage, res);
        setMessage(errorMessage);
        setLoading(false);
        return;
      }

      const token = extractToken(res);

      if (!token) {
        console.warn("Login succeeded but no token returned:", res);
        setMessage(
          "Login successful but token was not provided. Please contact support."
        );
        setLoading(false);
        return;
      }

      persistAuthToken(token, rememberMe);
      setMessage(res?.message || "Login successful!");
      setTimeout(() => {
        navigate("/");
      }, 500);
    } catch (error: any) {
      console.error("Login error:", error);
      const apiMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Login failed. Please try again.";
      setMessage(apiMessage);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-200 via-white to-blue-200 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-40 -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-40 translate-y-1/2 -translate-x-1/2"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-30 -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-size-[24px_24px]"></div>
        <div className="absolute top-20 left-20 w-2 h-2 bg-blue-400 rounded-full opacity-50"></div>
        <div className="absolute top-40 right-40 w-3 h-3 bg-blue-500 rounded-full opacity-30"></div>
        <div className="absolute bottom-32 left-1/3 w-2 h-2 bg-blue-600 rounded-full opacity-40"></div>
        <div className="absolute top-1/3 right-1/4 w-16 h-16 border-2 border-blue-200 rounded-lg opacity-20 rotate-12"></div>
        <div className="absolute bottom-1/4 left-1/4 w-12 h-12 border-2 border-blue-300 rounded-full opacity-20"></div>
      </div>
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
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 pt-4">
              Welcome back
            </h1>
            <p className="text-lg text-gray-600">
              Sign in to your account to continue managing your tasks
              efficiently.
            </p>
          </div>
          <div className="space-y-4 pt-8">
            <div className="flex items-start space-x-3">
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
                <h3 className="font-semibold text-gray-900">
                  Secure Authentication
                </h3>
                <p className="text-sm text-gray-600">
                  Your data is protected with enterprise-grade security
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
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
                <h3 className="font-semibold text-gray-900">Fast & Reliable</h3>
                <p className="text-sm text-gray-600">
                  Lightning-fast access to your dashboard
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
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
                <h3 className="font-semibold text-gray-900">24/7 Support</h3>
                <p className="text-sm text-gray-600">
                  Our team is always here to help you
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="w-full">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 md:p-10">
            <div className="md:hidden mb-6">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <svg
                    className="w-6 h-6 text-white"
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
                  <h3 className="text-xl font-bold text-gray-900">TaskTrust</h3>
                </div>
              </div>
            </div>
            <LoginForm
              loading={loading}
              message={message}
              onSubmit={handleLogin}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
