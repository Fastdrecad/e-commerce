import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useGetVerifyUserQuery } from "@/api/authApi";
import { toast } from "react-toastify";
import { skipToken } from "@reduxjs/toolkit/query";
import { useDispatch } from "react-redux";
import { setEmailVerified } from "./authSlice";
import Button from "@/components/ui/Button";

/**
 * Component for handling email verification process
 * This component is shown when a user clicks on the email verification link
 */
export function EmailVerification() {
  // Get token from URL query params
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const token = searchParams.get("token");

  // Call verification API endpoint if token exists
  const { data, isLoading, isError } = useGetVerifyUserQuery(
    token || skipToken,
    {
      skip: !token
    }
  );

  // Handle token validation and verification result
  useEffect(() => {
    if (!token) {
      toast.error("Invalid verification link");
      navigate("/auth");
      return;
    }

    if (!isLoading) {
      if (data?.verified) {
        toast.success("Email verified successfully!");
        dispatch(setEmailVerified());

        // Redirect to auth page with success message
        navigate("/auth", {
          state: {
            verificationSuccess: true,
            message: "Your email has been verified. You can now log in."
          }
        });
      } else if (isError) {
        toast.error(
          "Verification failed. Please try again or contact support."
        );
      }
    }
  }, [isLoading, data, isError, token, navigate, dispatch]);

  return (
    <div className="email-verification">
      <div className="email-verification__container">
        <h1 className="email-verification__title">
          {isLoading ? "Verifying Your Email" : "Email Verification"}
        </h1>

        <div className="email-verification__content">
          {isLoading ? (
            <div className="email-verification__loading">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3">Verifying your email address...</p>
              <p className="text-muted">
                Please wait while we verify your email...
              </p>
            </div>
          ) : isError ? (
            <div className="email-verification__error">
              <h5 className="text-danger mb-3">Verification Failed</h5>
              <p className="mb-4">
                We couldn't verify your email address. This might be because:
              </p>
              <ul className="mb-4">
                <li>The verification link has expired</li>
                <li>The verification link was already used</li>
                <li>The verification link is invalid</li>
              </ul>
              <div className="d-grid gap-3">
                <Button
                  variant="secondary"
                  text="Back to Login"
                  onClick={() => navigate("/auth")}
                  fullWidth
                />
              </div>
            </div>
          ) : data?.verified ? (
            <div className="email-verification__success">
              <h3 className="text-success">Email Verified Successfully!</h3>
              <p>Your email has been verified. You can now log in.</p>
              <Button
                variant="primary"
                text="Go to Login"
                onClick={() => navigate("/auth")}
                fullWidth
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
