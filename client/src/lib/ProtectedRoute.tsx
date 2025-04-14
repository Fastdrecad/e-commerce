import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAppSelector } from "@/store/hooks";
import { selectToken } from "@/features/auth/authSlice";
import { jwtDecode, JwtPayload } from "jwt-decode";
import { logout } from "@/features/auth/authSlice";
import { useDispatch } from "react-redux";
import { useHasPermission } from "@/utils/auth-abac";
type ProtectedRouteProps = {
  children: React.ReactNode;
};

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const token = useAppSelector(selectToken); // Check for JWT
  const location = useLocation();
  const dispatch = useDispatch();
  const { canView } = useHasPermission("APP");

  // Redirect to login if no token is present
  if (!token) {
    return <Navigate to={"/auth"} state={{ from: location }} replace />;
  }
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    const currentTime = Date.now() / 1000;

    // Check if the token is expired
    if (decoded.exp && decoded.exp < currentTime) {
      dispatch(logout());
      return <Navigate to={"/auth"} state={{ from: location }} replace />;
    }
    if (!canView) {
      return <Navigate to={"/error/401"} state={{ from: location }} replace />;
    }
  } catch (error) {
    dispatch(logout());
    console.error("Invalid token:", error);
    return <Navigate to={"/auth"} state={{ from: location }} replace />;
  }
  return <>{children}</>; // Render children if token exists
}
