// src/components/VerifiedBadge.tsx
import { FiCheckCircle } from "react-icons/fi";

type VerifiedBadgeProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
};

const VerifiedBadge = ({ className = "", size = "md" }: VerifiedBadgeProps) => {
  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-blue-600 text-white ${sizeClasses[size]} ${className}`}
      title="Verified User"
    >
      <FiCheckCircle className="w-full h-full p-0.5" />
    </span>
  );
};

export default VerifiedBadge;

