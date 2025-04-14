// components/forms/RegisterForm.tsx
import { useForm, SubmitHandler, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FormInput } from "@/components/ui/FormInput";
import { Link, useNavigate } from "react-router-dom";
import Button from "@/components/ui/Button";
import { useRegisterMutation } from "@/api/authApi";
import { toast } from "react-toastify";
import { ErrorResponse } from "@/types/api";

const passwordRegex =
  /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-.]).{8,}$/;

const RegisterSchema = z
  .object({
    firstName: z.string().min(1, { message: "First name is required" }),
    lastName: z.string().min(1, { message: "Last name is required" }),
    email: z
      .string()
      .min(1, { message: "Email is required" })
      .email({ message: "Invalid email format" }),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(64, "Password must be less than 64 characters")
      .regex(passwordRegex, {
        message:
          "Password must contain uppercase, lowercase, number, and special character"
      }),
    confirmPassword: z
      .string()
      .min(1, { message: "Please confirm your password" })
  })
  .superRefine(({ confirmPassword, password }, ctx) => {
    if (confirmPassword !== password) {
      ctx.addIssue({
        code: "custom",
        message: "Passwords do not match",
        path: ["confirmPassword"]
      });
    }
  });

type RegisterFormData = z.infer<typeof RegisterSchema>;

interface RegisterFormProps {
  email: string;
}

const RegisterForm = ({ email }: RegisterFormProps) => {
  const methods = useForm<RegisterFormData>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      email: email || ""
    }
  });

  const { handleSubmit } = methods;
  const [registerUser, { isLoading }] = useRegisterMutation();
  const navigate = useNavigate();

  const onSubmit: SubmitHandler<RegisterFormData> = async ({
    firstName,
    lastName,
    email,
    password,
    confirmPassword
  }) => {
    try {
      await registerUser({
        firstName,
        lastName,
        email,
        password,
        confirmPassword
      }).unwrap();

      toast.success(
        "Registration successful! Please check your email to verify your account.",
        {
          toastId: "registration-success-message"
        }
      );

      // Navigate to verification message page with email
      navigate("/auth/verify-email", {
        state: {
          email,
          registrationTime: new Date().toISOString()
        }
      });
    } catch (err) {
      const error = err as ErrorResponse;
      console.error("Registration Error:", error);
      if (error.message === "Email already exists") {
        toast.error(
          "This email is already registered. Please use a different email."
        );
      } else {
        toast.error(error.message || "Registration failed");
      }
    }
  };

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="register-form"
      >
        <div className="d-flex flex-column align-items-center justify-content-center register-form__container">
          <div className="align-self-baseline register-form__header">
            <h1 className="register-form__logo">Goddess Within</h1>
            <h2 className="register-form__title">Create your account</h2>
            <p className="register-form__subtitle">
              Complete your registration to get started
            </p>
          </div>

          <FormInput
            name="firstName"
            labelText="First Name"
            placeholder="Enter your first name"
            fullWidth
          />
          <FormInput
            name="lastName"
            labelText="Last Name"
            placeholder="Enter your last name"
            fullWidth
          />
          <FormInput
            name="email"
            labelText="Email Address"
            fullWidth
            value={email}
            readOnly
          />
          <FormInput
            name="password"
            labelText="Password"
            type="password"
            fullWidth
            showPasswordToggle
            placeholder="Create a password"
          />
          <FormInput
            name="confirmPassword"
            labelText="Confirm Password"
            type="password"
            fullWidth
            showPasswordToggle
            placeholder="Confirm your password"
          />

          <p className="register-form__disclaimer mt-4 mb-5">
            By registering for an account, you agree to our{" "}
            <Link to="" className="register-form__disclaimer-link">
              Terms of Use
            </Link>
            . Please read our{" "}
            <Link to="" className="register-form__disclaimer-link">
              Privacy Notice
            </Link>
            .
          </p>

          <Button
            type="submit"
            variant="primary"
            text="Register"
            size="large"
            disabled={isLoading}
            fullWidth
          />
        </div>
      </form>
    </FormProvider>
  );
};

export default RegisterForm;
