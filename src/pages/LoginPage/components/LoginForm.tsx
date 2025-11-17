import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { IoEyeOutline, IoEyeOffOutline } from "react-icons/io5";

type LoginFormProps = {
  loading?: boolean;
  message?: string;
  onSubmit: (payload: {
    email: string;
    password: string;
    rememberMe: boolean;
  }) => void;
};

const LoginForm: React.FC<LoginFormProps> = ({
  loading = false,
  message = "",
  onSubmit,
}) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email: string; password: string }>({
    email: "",
    password: "",
  });
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validate = (currentEmail: string, currentPassword: string) => {
    const nextErrors = { email: "", password: "" };
    if (!currentEmail.trim()) {
      nextErrors.email = "Email is required";
    } else if (!emailRegex.test(currentEmail)) {
      nextErrors.email = "Invalid email address";
    }

    if (!currentPassword.trim()) {
      nextErrors.password = "Password is required";
    }
    return nextErrors;
  };

  const handleBlur = (field: "email" | "password") => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors(validate(email, password));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const validation = validate(email, password);
    setErrors(validation);
    setTouched({ email: true, password: true });

    const hasError = Object.values(validation).some(Boolean);
    if (hasError || loading) {
      return;
    }

    onSubmit({ email, password, rememberMe });
  };

  const showEmailError =
    !!errors.email && (touched.email || email.length > 0 || message);
  const showPasswordError =
    !!errors.password && (touched.password || password.length > 0 || message);

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Sign In</h2>
        <p className="text-gray-600 mt-2">
          Enter your credentials to access your account
        </p>
      </div>
      <div className="space-y-4">
        <div>
          <label
            className="block text-sm font-medium text-gray-700 mb-1"
            htmlFor="login-email"
          >
            Email
          </label>
          <input
            id="login-email"
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
            aria-describedby={showEmailError ? "login-email-error" : undefined}
          />
          {showEmailError && (
            <p
              id="login-email-error"
              className="mt-1 text-sm text-red-600"
              role="alert"
            >
              {errors.email}
            </p>
          )}
        </div>
        <div>
          <label
            className="block text-sm font-medium text-gray-700 mb-1"
            htmlFor="login-password"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              onBlur={() => handleBlur("password")}
              className={`w-full px-4 py-2 pr-10 border rounded-lg focus:ring-2 outline-none transition ${
                showPasswordError
                  ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                  : "border-gray-300 focus:ring-blue-500 focus:border-transparent"
              }`}
              placeholder="••••••••"
              aria-invalid={showPasswordError}
              aria-describedby={
                showPasswordError ? "login-password-error" : undefined
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
          {showPasswordError && (
            <p
              id="login-password-error"
              className="mt-1 text-sm text-red-600"
              role="alert"
            >
              {errors.password}
            </p>
          )}
        </div>
        <div className="flex items-center justify-between">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
            />
            <span className="ml-2 text-sm text-gray-600">Remember me</span>
          </label>
          <button
            type="button"
            onClick={() => navigate("/forgot-password")}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Forgot password?
          </button>
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
          {loading ? "Signing In..." : "Sign In"}
        </button>
      </div>
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Don't have an account?{" "}
          <a
            onClick={() => navigate("/register")}
            className="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
          >
            Sign up here
          </a>
        </p>
      </div>
    </form>
  );
};

export default LoginForm;
