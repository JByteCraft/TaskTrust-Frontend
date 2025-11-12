// src/pages/RegisterPage/components/RegisterForm.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { IoEyeOutline, IoEyeOffOutline } from "react-icons/io5";

type RegisterFormData = {
  firstName: string;
  lastName: string;
  middleName: string;
  gender: "male" | "female";
  role: "customer" | "tasker";
  email: string;
  password: string;
  confirmPassword: string;
};

const RegisterForm = ({ onShowOTP }: { onShowOTP: (data: any) => void }) => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState<RegisterFormData>({
    firstName: "",
    lastName: "",
    middleName: "",
    gender: "male",
    role: "customer",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<{
    email: string;
    password: string;
    confirmPassword: string;
  }>({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;

  const validate = (data: RegisterFormData) => {
    const validationErrors = {
      email: "",
      password: "",
      confirmPassword: "",
    };

    if (!data.email.trim()) {
      validationErrors.email = "Email is required";
    } else if (!emailRegex.test(data.email)) {
      validationErrors.email = "Invalid email format";
    }

    if (!data.password) {
      validationErrors.password = "Password is required";
    } else if (!passwordRegex.test(data.password)) {
      validationErrors.password =
        "Must be 8+ chars, include 1 uppercase letter & 1 symbol";
    }

    if (!data.confirmPassword) {
      validationErrors.confirmPassword = "Please confirm your password";
    } else if (data.password !== data.confirmPassword) {
      validationErrors.confirmPassword = "Passwords do not match";
    }

    return validationErrors;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    const updatedData = { ...formData, [name]: value } as RegisterFormData;
    setFormData(updatedData);
    setErrors(validate(updatedData));
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors(validate(formData));
  };

  const handleRoleChange = (role: "customer" | "tasker") => {
    setFormData({ ...formData, role });
  };

  const handleSubmit = () => {
    setSubmitted(true);
    const validationErrors = validate(formData);
    setErrors(validationErrors);

    const hasErrors = Object.values(validationErrors).some(
      (errorMessage) => errorMessage.length > 0
    );
    if (hasErrors) {
      return;
    }
    const { confirmPassword, ...payload } = formData;
    onShowOTP(payload);
  };

  const shouldShowEmailError =
    !!errors.email && (touched.email || submitted || formData.email.length > 0);
  const shouldShowPasswordError =
    !!errors.password &&
    (touched.password || submitted || formData.password.length > 0);
  const shouldShowConfirmPasswordError =
    !!errors.confirmPassword &&
    (touched.confirmPassword ||
      submitted ||
      formData.confirmPassword.length > 0);

  return (
    <div>
      {/* Register Form Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Create Account</h2>
        <p className="text-gray-600 mt-2">
          Sign up to get started with TaskTrust
        </p>
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              className="block text-sm font-medium text-gray-700 mb-1"
              htmlFor="firstName"
            >
              First Name
            </label>
            <input
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="John"
            />
          </div>
          <div>
            <label
              className="block text-sm font-medium text-gray-700 mb-1"
              htmlFor="lastName"
            >
              Last Name
            </label>
            <input
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="Doe"
            />
          </div>
        </div>

        <div>
          <label
            className="block text-sm font-medium text-gray-700 mb-1"
            htmlFor="middleName"
          >
            Middle Name
          </label>
          <input
            id="middleName"
            name="middleName"
            value={formData.middleName}
            onChange={handleChange}
            type="text"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            placeholder="Smith"
          />
        </div>

        <div>
          <label
            className="block text-sm font-medium text-gray-700 mb-1"
            htmlFor="gender"
          >
            Gender
          </label>
          <select
            id="gender"
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white"
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Are you a:
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleRoleChange("tasker")}
              className={`px-4 py-3 border-2 rounded-lg text-left transition ${
                formData.role === "tasker"
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:border-blue-500 hover:bg-blue-50"
              }`}
            >
              <div className="font-semibold text-gray-900">Tasker</div>
              <div className="text-xs text-gray-600 mt-0.5">
                Offer your services
              </div>
            </button>
            <button
              type="button"
              onClick={() => handleRoleChange("customer")}
              className={`px-4 py-3 border-2 rounded-lg text-left transition ${
                formData.role === "customer"
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:border-blue-500 hover:bg-blue-50"
              }`}
            >
              <div className="font-semibold text-gray-900">Customer</div>
              <div className="text-xs text-gray-600 mt-0.5">
                Find taskers to help
              </div>
            </button>
          </div>
        </div>

        <div>
          <label
            className="block text-sm font-medium text-gray-700 mb-1"
            htmlFor="email"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            onBlur={handleBlur}
            type="email"
            aria-describedby={shouldShowEmailError ? "email-error" : undefined}
            className={`w-full px-4 py-2 border rounded-lg outline-none transition ${
              shouldShowEmailError
                ? "border-red-500 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                : "border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            }`}
            placeholder="your@email.com"
          />
          {shouldShowEmailError && (
            <p id="email-error" className="mt-1 text-sm text-red-600">
              {errors.email}
            </p>
          )}
        </div>

        <div>
          <label
            className="block text-sm font-medium text-gray-700 mb-1"
            htmlFor="password"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              onBlur={handleBlur}
              type={showPassword ? "text" : "password"}
              aria-describedby={
                shouldShowPasswordError ? "password-error" : undefined
              }
              className={`w-full px-4 py-2 pr-10 border rounded-lg outline-none transition ${
                shouldShowPasswordError
                  ? "border-red-500 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  : "border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              }`}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
            >
              {showPassword ? (
                <IoEyeOffOutline className="w-5 h-5" />
              ) : (
                <IoEyeOutline className="w-5 h-5" />
              )}
            </button>
          </div>
          {shouldShowPasswordError && (
            <p id="password-error" className="mt-1 text-sm text-red-600">
              {errors.password}
            </p>
          )}
        </div>

        <div>
          <label
            className="block text-sm font-medium text-gray-700 mb-1"
            htmlFor="confirmPassword"
          >
            Confirm Password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              type={showConfirmPassword ? "text" : "password"}
              aria-describedby={
                shouldShowConfirmPasswordError
                  ? "confirm-password-error"
                  : undefined
              }
              className={`w-full px-4 py-2 pr-10 border rounded-lg outline-none transition ${
                shouldShowConfirmPasswordError
                  ? "border-red-500 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  : "border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              }`}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
            >
              {showConfirmPassword ? (
                <IoEyeOffOutline className="w-5 h-5" />
              ) : (
                <IoEyeOutline className="w-5 h-5" />
              )}
            </button>
          </div>
          {shouldShowConfirmPasswordError && (
            <p
              id="confirm-password-error"
              className="mt-1 text-sm text-red-600"
            >
              {errors.confirmPassword}
            </p>
          )}
        </div>

        <div className="flex items-start">
          <input
            type="checkbox"
            id="terms"
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
          />
          <label className="ml-2 text-sm text-gray-600" htmlFor="terms">
            I agree to the{" "}
            <a href="#" className="text-blue-600 hover:underline font-medium">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-blue-600 hover:underline font-medium">
              Privacy Policy
            </a>
          </label>
        </div>

        <button
          onClick={handleSubmit}
          className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition"
        >
          Create Account
        </button>
      </div>

      {/* Sign in link */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{" "}
          <a
            onClick={() => navigate("/login")}
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
};

export default RegisterForm;
