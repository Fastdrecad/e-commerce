import { baseApi } from "./apiSlice";
import { backendUserToFrontendModel, UserBackend } from "@/types/user/user";

// Define interfaces for API requests and responses
interface LoginCredentials {
  email: string;
  password: string;
}

interface GoogleLoginArgs {
  tokenId: string;
}

interface FacebookLoginArgs {
  accessToken: string;
  userID: string;
}

interface AppleLoginArgs {
  token: string;
  firstName?: string;
  lastName?: string;
  email: string;
}

interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  user: UserBackend;
  expiresIn?: number;
  [key: string]: unknown;
}

interface CheckEmailResponse {
  exists: boolean;
  isVerified?: boolean;
}

interface ResetPasswordArgs {
  token: string;
  password: string;
}

interface VerifyEmailResponse {
  verified: boolean;
  message: string;
}

const authUrl = "/auth";

export const tagTypes = ["auth"] as const;

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Authentication endpoints
    login: builder.mutation<AuthResponse, LoginCredentials>({
      query: (credentials) => ({
        url: `${authUrl}/login`,
        method: "POST",
        data: credentials
      })
    }),

    register: builder.mutation({
      query: (data) => ({
        url: `${authUrl}/register`,
        method: "POST",
        data
      })
    }),

    checkEmailExists: builder.query<CheckEmailResponse, string>({
      query: (email) => ({
        url: `${authUrl}/check-email?email=${encodeURIComponent(email)}`,
        method: "GET"
      })
    }),

    // Password management
    forgotPassword: builder.mutation<void, string>({
      query: (email) => ({
        url: `${authUrl}/forgot-password`,
        method: "POST",
        data: { email }
      })
    }),

    resetPassword: builder.mutation<void, ResetPasswordArgs>({
      query: ({ token, password }) => ({
        url: `${authUrl}/reset-password`,
        method: "POST",
        data: { token, password }
      })
    }),

    // Email verification
    getVerifyUser: builder.query<VerifyEmailResponse, string>({
      query: (token) => ({
        url: `${authUrl}/verify-email/${token}`,
        method: "GET"
      })
    }),

    resendVerificationEmail: builder.mutation<void, string>({
      query: (email) => ({
        url: `${authUrl}/resend-verification`,
        method: "POST",
        data: { email }
      })
    }),

    // Profile management
    getUserProfile: builder.query({
      query: () => ({
        url: "/user/me"
      }),
      providesTags: ["Auth"],
      transformResponse: (response: UserBackend) => {
        return backendUserToFrontendModel(response);
      }
    }),

    // Social authentication
    googleLogin: builder.mutation<AuthResponse, GoogleLoginArgs>({
      query: ({ tokenId }) => ({
        url: `${authUrl}/oauth/google`,
        method: "POST",
        data: { tokenId }
      }),
      invalidatesTags: ["Auth"]
    }),

    facebookLogin: builder.mutation<AuthResponse, FacebookLoginArgs>({
      query: ({ accessToken, userID }) => ({
        url: `${authUrl}/oauth/facebook`,
        method: "POST",
        data: { accessToken, userID }
      }),
      invalidatesTags: ["Auth"]
    }),

    appleLogin: builder.mutation<AuthResponse, AppleLoginArgs>({
      query: ({ token, firstName, lastName, email }) => ({
        url: `${authUrl}/oauth/apple`,
        method: "POST",
        data: { token, firstName, lastName, email }
      }),
      invalidatesTags: ["Auth"]
    })
  })
});

export const {
  useLoginMutation,
  useGetUserProfileQuery,
  useRegisterMutation,
  useLazyGetUserProfileQuery,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useGetVerifyUserQuery,
  useResendVerificationEmailMutation,
  useGoogleLoginMutation,
  useFacebookLoginMutation,
  useAppleLoginMutation,
  useLazyCheckEmailExistsQuery
} = authApi;
