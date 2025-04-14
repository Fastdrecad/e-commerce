import { AppRoot } from "@/app/routes/route";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

const createAppRouter = () =>
  createBrowserRouter([
    {
      path: "/home",
      element: <AppRoot />
    },
    {
      path: "/auth",
      lazy: async () => {
        const { AuthFlowRoute } = await import(
          "@/app/routes/auth/AuthFlowRoute.tsx"
        );
        return { Component: AuthFlowRoute };
      }
    },
    {
      path: "/auth/register",
      lazy: async () => {
        const { RegisterRoute } = await import(
          "@/app/routes/auth/RegisterRoute.tsx"
        );
        return { Component: RegisterRoute };
      }
    },
    // This route handles both verification message and email verification
    {
      path: "/auth/verify-email",
      lazy: async () => {
        const { VerifyAccount } = await import(
          "@/app/routes/auth/VerifyAccountRoute.tsx"
        );
        return { Component: VerifyAccount };
      }
    },
    {
      path: "/auth/forgot-password",
      lazy: async () => {
        const { ForgotPasswordRoute } = await import(
          "@/app/routes/auth/ForgotPasswordRoute.tsx"
        );
        return { Component: ForgotPasswordRoute };
      }
    },
    {
      path: "/auth/reset-password",
      lazy: async () => {
        const { ResetPassword } = await import(
          "@/app/routes/auth/ResetPasswordRoute.tsx"
        );
        return { Component: ResetPassword };
      }
    }
  ]);

export function AppRouter() {
  const router = createAppRouter();

  return <RouterProvider router={router} />;
}
