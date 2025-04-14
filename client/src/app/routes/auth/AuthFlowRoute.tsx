import { AuthLayout } from "@/components/layout/AuthLayout";
import AuthFlowForm from "@/features/auth/AuthFlowForm";

export const AuthFlowRoute = () => {
  return (
    <AuthLayout>
      <AuthFlowForm />
    </AuthLayout>
  );
};
