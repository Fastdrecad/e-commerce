import { AuthLayout } from "@/components/layout/AuthLayout";
import RegisterForm from "@/features/auth/RegisterForm";
import { useNavigate } from "react-router-dom";

export const RegisterRoute = () => {
  const navigate = useNavigate();

  const handleBackToEmail = () => {
    navigate("/auth");
  };

  return (
    <AuthLayout>
      <RegisterForm email={""} onBack={handleBackToEmail} />
    </AuthLayout>
  );
};
