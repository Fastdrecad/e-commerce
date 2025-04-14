import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Button from "@/components/ui/Button";
import { useDispatch } from "react-redux";
import { authSlice } from "./authSlice";
import { toast } from "react-toastify";
import { useResendVerificationEmailMutation } from "@/api/authApi";

interface LocationState {
  email?: string;
}

/**
 * Component for displaying instructions after registration
 * Shows email verification instructions and allows user to resend verification email
 */
export const EmailVerificationMessage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const email = (location.state as LocationState)?.email;
  const [isResending, setIsResending] = useState(false);
  const [resendVerificationEmail] = useResendVerificationEmailMutation();

  // Clear auth state and check for email in state
  useEffect(() => {
    dispatch(authSlice.actions.logout());

    if (!email) {
      toast.error("No email address provided");
      navigate("/auth");
    }
  }, [dispatch, email, navigate]);

  /**
   * Handle resending verification email
   */
  const handleResendVerification = async () => {
    if (!email) return;

    try {
      setIsResending(true);
      await resendVerificationEmail(email).unwrap();
      toast.success("Verification email has been resent successfully!");
    } catch (error) {
      console.error("Failed to resend verification email:", error);
      toast.error(
        "Failed to resend verification email. Please try again later."
      );
    } finally {
      setIsResending(false);
    }
  };

  // Redirect if no email is provided
  if (!email) {
    return null;
  }

  return (
    <div className="email-verification-message">
      <div className="email-verification-message__container">
        <h1 className="email-verification-message__title">Verify Your Email</h1>

        <div className="email-verification-message__content">
          <p>
            We've sent a verification email to <strong>{email}</strong>. Please
            check your inbox and click the verification link to complete your
            registration.
          </p>

          <div className="email-verification-message__troubleshooting">
            <h3>Didn't receive the email?</h3>
            <ol>
              <li>Check your spam folder</li>
              <li>Make sure you entered the correct email address</li>
              <li>Wait a few minutes and try again</li>
            </ol>
          </div>

          <div className="email-verification-message__actions">
            <Button
              variant="secondary"
              text={isResending ? "Sending..." : "Resend Verification Email"}
              onClick={handleResendVerification}
              className="mb-3"
              fullWidth
              disabled={isResending}
            />
            <Button
              variant="primary"
              text="Back to Login"
              onClick={() => navigate("/auth")}
              fullWidth
            />
          </div>
        </div>
      </div>
    </div>
  );
};
