import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { getStoredAuthToken } from "../lib/utils/auth.utils";

type GuestRouteProps = {
  children: ReactNode;
  redirectTo?: string;
};

const GuestRoute = ({ children, redirectTo = "/" }: GuestRouteProps) => {
  const token = getStoredAuthToken();

  if (token) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

export default GuestRoute;

