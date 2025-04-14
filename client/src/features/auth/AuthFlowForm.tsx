import { useState, useEffect } from "react";
import EmailAuth from "./EmailAuth";
import RegisterForm from "./RegisterForm";
import LoginForm from "./LoginForm";
import { useLazyCheckEmailExistsQuery } from "@/api/authApi";
import { toast } from "react-toastify";
import {
  useGoogleLoginMutation,
  useFacebookLoginMutation
} from "@/api/authApi";
import { useDispatch } from "react-redux";
import { authSlice } from "@/features/auth/authSlice";
import { setBearerToken } from "@/api/axiosInstance";
import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";
import { useNavigate, useLocation } from "react-router-dom";

// Get Google client ID from environment variables
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
const isGoogleConfigured = !!googleClientId;
const isFacebookConfigured = !!import.meta.env.VITE_FACEBOOK_APP_ID;

const AuthFlowForm = () => {
  const [step, setStep] = useState<"email" | "auth">("email");
  const [email, setEmail] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [checkEmailExists] = useLazyCheckEmailExistsQuery();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Check for verification success message
  const verificationSuccess = location.state?.verificationSuccess;
  const verificationMessage = location.state?.message;

  useEffect(() => {
    if (verificationSuccess) {
      toast.success(
        verificationMessage ||
          "Your email has been verified. You can now log in."
      );
    }
  }, [verificationSuccess, verificationMessage]);

  // RTK Query hooks for OAuth
  const [googleLogin] = useGoogleLoginMutation();
  const [facebookLogin] = useFacebookLoginMutation();

  const handleEmailSubmit = async (submittedEmail: string) => {
    setEmail(submittedEmail);

    try {
      // Check if the email exists in the database
      const result = await checkEmailExists(submittedEmail).unwrap();

      // Set the initial mode based on whether the email exists, but allow switching
      setMode(result.exists ? "login" : "register");
      setStep("auth");
    } catch (error) {
      console.error("Error checking email:", error);
      toast.error(
        "There was an error processing your request. Please try again."
      );
      // Default to register in case of error
      setMode("register");
      setStep("auth");
    }
  };

  // Handle success response from any OAuth provider
  const handleOAuthSuccess = (data: AuthResponse) => {
    // Set the bearer token for future API calls
    setBearerToken(data.accessToken);

    // Update auth state in Redux
    dispatch(
      authSlice.actions.setUserData({
        user: data.user,
        token: data.accessToken,
        isAuthenticated: true
      })
    );

    toast.success("Login successful");
    navigate("/dashboard");
  };

  // Google OAuth login
  const handleGoogleLogin = async (tokenId: string) => {
    try {
      const response = await googleLogin({ tokenId }).unwrap();
      handleOAuthSuccess(response);
    } catch (error) {
      console.error("Google login error:", error);
      toast.error("Google login failed. Please try again.");
    }
  };

  // Facebook OAuth login
  const handleFacebookLogin = async (response: {
    accessToken: string;
    userID: string;
  }) => {
    try {
      const { accessToken, userID } = response;
      const result = await facebookLogin({ accessToken, userID }).unwrap();
      handleOAuthSuccess(result);
    } catch (error) {
      console.error("Facebook login error:", error);
      toast.error("Facebook login failed. Please try again.");
    }
  };

  // Apple OAuth login - not directly used yet but kept for future implementation
  /* Commented out to avoid linter errors - will be implemented with Apple Sign In SDK
  const handleAppleLogin = async (response: {
    token: string;
    email: string;
    firstName?: string;
    lastName?: string;
  }) => {
    try {
      const { token, email, firstName, lastName } = response;
      const result = await appleLogin({ token, email, firstName, lastName }).unwrap();
      handleOAuthSuccess(result);
    } catch (error) {
      console.error("Apple login error:", error);
      toast.error("Apple login failed. Please try again.");
    }
  };
  */

  const handleOAuthClick = (provider: "google" | "apple" | "facebook") => {
    if (provider === "google") {
      if (!isGoogleConfigured) {
        toast.error(
          "Google OAuth is not properly configured. Please set VITE_GOOGLE_CLIENT_ID in your environment variables."
        );
        return;
      }
      // Google OAuth is handled by the GoogleLoginButton component
      if (window.triggerGoogleLogin) {
        window.triggerGoogleLogin();
      }
    } else if (provider === "facebook") {
      if (!isFacebookConfigured) {
        toast.error(
          "Facebook OAuth is not properly configured. Please set VITE_FACEBOOK_APP_ID in your environment variables."
        );
        return;
      }
      // Initiate Facebook login
      window.FB?.login(
        (response) => {
          if (response.authResponse) {
            handleFacebookLogin({
              accessToken: response.authResponse.accessToken,
              userID: response.authResponse.userID
            });
          } else {
            console.log("Facebook login cancelled by user");
          }
        },
        { scope: "email,public_profile" }
      );
    } else if (provider === "apple") {
      // Apple Sign In needs to be implemented with Apple's JS SDK
      // This is a placeholder and needs to be implemented based on Apple's documentation
      toast.info("Apple Sign In functionality will be implemented soon");
    }
  };

  const handleBackToEmail = () => {
    setStep("email");
  };

  // Setup Facebook SDK only if configured
  useEffect(() => {
    if (!isFacebookConfigured) return;

    // Initialize Facebook SDK
    window.fbAsyncInit = function () {
      window.FB?.init({
        appId: import.meta.env.VITE_FACEBOOK_APP_ID || "",
        cookie: true,
        xfbml: true,
        version: "v16.0"
      });
    };

    // Load the Facebook SDK asynchronously
    (function (d, s, id) {
      const fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) return;
      const js = d.createElement(s) as HTMLScriptElement;
      js.id = id;
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      fjs.parentNode?.insertBefore(js, fjs);
    })(document, "script", "facebook-jssdk");
  }, []);

  // Inner component for Google login to use the hook
  const GoogleLoginButton = () => {
    const login = useGoogleLogin({
      onSuccess: async (codeResponse) => {
        try {
          // Exchange authorization code for tokens
          handleGoogleLogin(codeResponse.access_token);
        } catch (error) {
          console.error("Google auth error:", error);
          toast.error("Google authentication failed");
        }
      },
      onError: (error) => {
        console.error("Google login error:", error);
        toast.error("Google login failed. Please try again.");
      }
    });

    // This is only used internally to connect to the OAuth click handler
    useEffect(() => {
      // Create a global handler that the main component can access
      window.triggerGoogleLogin = () => {
        login();
      };

      return () => {
        // Cleanup
        delete window.triggerGoogleLogin;
      };
    }, [login]);

    return null;
  };

  // Render the main component
  const renderContent = () => (
    <>
      {step === "email" && (
        <EmailAuth
          onEmailSubmit={handleEmailSubmit}
          onOAuthClick={handleOAuthClick}
          oauthConfig={{
            googleEnabled: isGoogleConfigured,
            facebookEnabled: isFacebookConfigured,
            appleEnabled: false
          }}
        />
      )}

      {step === "auth" && (
        <div className="auth-flow-container">
          {mode === "login" ? (
            <>
              <LoginForm email={email} onBack={handleBackToEmail} />
              <div className="auth-switch mt-4 text-center">
                <p>
                  Don't have an account?{" "}
                  <span
                    className="auth-switch-link"
                    onClick={() => setMode("register")}
                    style={{ cursor: "pointer", color: "var(--bs-primary)" }}
                  >
                    Create one
                  </span>
                </p>
              </div>
            </>
          ) : (
            <>
              <RegisterForm email={email} />
              <div className="auth-switch mt-4 text-center">
                <p>
                  Already have an account?{" "}
                  <span
                    className="auth-switch-link"
                    onClick={() => setMode("login")}
                    style={{ cursor: "pointer", color: "var(--bs-primary)" }}
                  >
                    Sign in
                  </span>
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );

  // Wrap with GoogleOAuthProvider only if clientId is available
  return isGoogleConfigured ? (
    <GoogleOAuthProvider clientId={googleClientId}>
      <GoogleLoginButton />
      {renderContent()}
    </GoogleOAuthProvider>
  ) : (
    renderContent()
  );
};

// Global type declaration for window object
declare global {
  interface Window {
    FB?: {
      login(
        callback: (response: FacebookAuthResponse) => void,
        options?: { scope: string }
      ): void;
      init(options: {
        appId: string;
        cookie: boolean;
        xfbml: boolean;
        version: string;
      }): void;
    };
    fbAsyncInit?: () => void;
    triggerGoogleLogin?: () => void;
    google?: {
      accounts: {
        id: {
          prompt: () => void;
        };
      };
    };
  }
}

interface FacebookAuthResponse {
  authResponse: {
    accessToken: string;
    userID: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: Record<string, unknown>;
  [index: string]: unknown;
}

export default AuthFlowForm;
