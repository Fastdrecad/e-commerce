import React from "react";
import { Navigate } from "react-router-dom";
import { useAppSelector } from "@/store/hooks";
import { selectToken } from "@/features/auth/authSlice";

type PublicRouteProps = {
  children: React.ReactNode;
  redirectTo: string;
};

export function PublicRoute({ children, redirectTo }: PublicRouteProps) {
  const token = useAppSelector(selectToken);

  if (token) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
