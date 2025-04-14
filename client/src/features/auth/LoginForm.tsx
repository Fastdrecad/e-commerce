import { useForm, SubmitHandler, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FormInput } from "@/components/ui/FormInput";
import Button from "@/components/ui/Button";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import CustomLink from "@/components/ui/CustomLink";
import { useLoginMutation } from "@/api/authApi";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { authSlice } from "@/features/auth/authSlice";
import { ErrorResponse } from "@/types/api";
import { setBearerToken } from "@/api/axiosInstance";
import { backendUserToFrontendModel } from "@/types/user/user";

// Validation schema for login form
const schema = z.object({
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .optional()
});

type LoginFormData = z.infer<typeof schema>;

interface LoginFormProps {
  email: string;
  onBack: () => void;
}

const LoginForm = ({ email, onBack }: LoginFormProps) => {
  // Component state
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isResetLinkSent, setIsResetLinkSent] = useState(false);

  // Hooks
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [login, { isLoading: isLoginLoading }] = useLoginMutation();

  // Form setup
  const methods = useForm<LoginFormData>({
    resolver: zodResolver(schema),
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    shouldFocusError: false
  });

  /**
   * Handle form submission for both login and forgot password
   */
  const onSubmit: SubmitHandler<LoginFormData> = async ({ password }) => {
    if (isForgotPassword) {
      handleForgotPassword();
    } else {
      handleLogin(password);
    }
  };

  /**
   * Handle forgot password flow
   */
  const handleForgotPassword = () => {
    try {
      // TODO: This should use a separate forgotPassword mutation instead of login
      toast.error("Forgot password functionality is not implemented yet");
      setIsResetLinkSent(true);
    } catch (err) {
      const error = err as ErrorResponse;
      toast.error(
        error?.message || "Failed to send reset link. Please try again."
      );
    }
  };

  /**
   * Handle login flow
   */
  const handleLogin = async (password?: string) => {
    if (!password) {
      toast.error("Password is required");
      return;
    }

    try {
      const response = await login({
        email,
        password
      }).unwrap();

      // Set bearer token for future API calls
      setBearerToken(response.accessToken);

      // Transform the backend user data to frontend model
      const user = backendUserToFrontendModel(response.user);

      // Server is already checking email verification
      // Only redirect if explicitly marked as unverified
      if (response.user.isEmailVerified === false) {
        toast.warning("Please verify your email address before continuing.");
        navigate("/auth/verify-email", { state: { email } });
        return;
      }

      // Update auth state in Redux
      dispatch(
        authSlice.actions.setUserData({
          user,
          token: response.accessToken,
          isAuthenticated: true
        })
      );

      // Clear password from memory after successful login
      setTimeout(() => {
        // Force garbage collection of password variable
        methods.reset();
      }, 0);

      toast.success("Login successful");
      navigate("/home");
    } catch (err) {
      handleLoginError(err as ErrorResponse);
    }
  };

  /**
   * Handle login errors with specific error messages
   */
  const handleLoginError = (error: ErrorResponse) => {
    // Provide more specific error messages based on error status
    if (error.status === 400) {
      toast.error("Invalid email or password. Please try again.");
    } else if (error.status === 401) {
      toast.error("Unauthorized. Please check your credentials.");
    } else if (error.status === 403) {
      toast.error("Your account is not activated or has been suspended.");
      navigate("/auth/verify-email", { state: { email } });
    } else {
      toast.error(error.message || "Login failed. Please try again.");
    }
  };

  /**
   * Switch to forgot password mode
   */
  const onForgotPassword = () => {
    setIsForgotPassword(true);
    methods.clearErrors();
  };

  /**
   * Switch back to login mode
   */
  const onBackToSignIn = () => {
    setIsForgotPassword(false);
    setIsResetLinkSent(false);
    methods.clearErrors();
  };

  /**
   * Handle form submission with different validation based on mode
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isForgotPassword) {
      // For forgot password, submit directly without validation
      onSubmit({});
    } else {
      // For login, use the form validation
      methods.handleSubmit(onSubmit)(e);
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit} noValidate className="login-form">
        <div className="d-flex flex-column align-items-center justify-content-center login-form__container">
          <div className="align-self-baseline login-form__header">
            <h1 className="login-form__logo">Goddess Within</h1>

            {!isResetLinkSent && (
              <h2 className="login-form__title mt-4">
                {!isForgotPassword
                  ? "Sign in to your account"
                  : "Reset your password"}
              </h2>
            )}
          </div>

          {!isResetLinkSent && (
            <FormInput
              name="email"
              labelText="Email Address"
              grayedOut={!isForgotPassword && !isResetLinkSent}
              value={email}
              readOnly
              fullWidth
              inputProps={{
                endAdornment: !isForgotPassword && (
                  <Link
                    to="/auth"
                    className="login-form__edit-link"
                    onClick={(e) => {
                      e.preventDefault();
                      onBack();
                    }}
                  >
                    Edit
                  </Link>
                )
              }}
            />
          )}

          {!isForgotPassword && !isResetLinkSent && (
            <FormInput
              name="password"
              labelText="Password"
              type="password"
              fullWidth
              showPasswordToggle
              placeholder="Enter your password"
            />
          )}

          {isResetLinkSent ? (
            <div className="login-form__success-card mt-5">
              <p className="login-form__success-message">
                Reset instructions have been sent to {email}. Check your email,
                then come back here to continue.
              </p>
              <div className="login-form__troubleshooting">
                <h3 className="login-form__troubleshooting-title">
                  Didn't get the email?
                </h3>
                <ol className="login-form__troubleshooting-list p-0">
                  <li>Check your spam folder</li>
                  <li>Check your email address.</li>
                  <li>
                    Wait 15 minutes before trying again, as some requests are
                    slow to process.
                  </li>
                </ol>
              </div>
              <CustomLink
                className="login-form__back-button align-self-start mt-4"
                onClick={onBackToSignIn}
              >
                <span>Back to sign in</span>
              </CustomLink>
            </div>
          ) : (
            <>
              <Button
                type="submit"
                variant="primary"
                text={isForgotPassword ? "Get reset link" : "Sign in"}
                size="large"
                disabled={isLoginLoading}
                fullWidth
                className="mt-4"
              />

              {isForgotPassword && (
                <CustomLink
                  className="login-form__back-button align-self-start mt-4"
                  onClick={onBackToSignIn}
                >
                  <span>Back to sign in</span>
                </CustomLink>
              )}
            </>
          )}

          <div className="login-form__footer align-self-start mt-4">
            {!isForgotPassword && !isResetLinkSent && (
              <CustomLink
                className="login-form__forgot-password"
                onClick={onForgotPassword}
              >
                Forgotten your password?
              </CustomLink>
            )}
          </div>
        </div>
      </form>
    </FormProvider>
  );
};

export default LoginForm;
