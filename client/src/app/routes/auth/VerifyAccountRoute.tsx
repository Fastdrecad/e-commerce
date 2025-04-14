import { AuthLayout } from "@/components/layout/AuthLayout";
import { EmailVerificationMessage } from "@/features/auth/EmailVerificationMessage";
import { EmailVerification } from "@/features/auth/EmailVerification";
import { useSearchParams } from "react-router-dom";

export const VerifyAccount = () => {
  const [searchParams] = useSearchParams();
  const hasToken = searchParams.has("token");

  return (
    <AuthLayout>
      {hasToken ? <EmailVerification /> : <EmailVerificationMessage />}
    </AuthLayout>
  );
};
