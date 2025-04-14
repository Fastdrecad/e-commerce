import { useForm, SubmitHandler, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FormInput } from "@/components/ui/FormInput";
import Button from "@/components/ui/Button";
import IconifyIcon from "@/components/common/IconifyIcon";
import CustomLink from "@/components/ui/CustomLink";
import { Row } from "reactstrap";
import { useState } from "react";
import { useLazyCheckEmailExistsQuery } from "@/api/authApi";
import { toast } from "react-toastify";

const schema = z.object({
  email: z
    .string()
    .min(1, "Email address is required")
    .email(
      "Please enter a valid email address (for example: your.name@domain.com)"
    )
});

type EmailAuthData = z.infer<typeof schema>;

interface EmailAuthProps {
  onEmailSubmit: (email: string) => void;
  onOAuthClick: (provider: "google" | "apple" | "facebook") => void;
  oauthConfig?: {
    googleEnabled: boolean;
    facebookEnabled: boolean;
    appleEnabled: boolean;
  };
}

const EmailAuth = ({
  onEmailSubmit,
  onOAuthClick,
  oauthConfig
}: EmailAuthProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const methods = useForm<EmailAuthData>({
    resolver: zodResolver(schema),
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    shouldFocusError: false
  });

  const [checkEmailExists] = useLazyCheckEmailExistsQuery();

  const onSubmit: SubmitHandler<EmailAuthData> = async (data) => {
    setIsLoading(true);
    try {
      // Blur any active element to prevent focus issues
      setTimeout(() => {
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      }, 10);

      // Check if email exists before proceeding
      const result = await checkEmailExists(data.email).unwrap();

      // Handle the response and pass the email to the parent component
      // If we got a successful response, proceed with the email flow
      onEmailSubmit(data.email);

      // Log the result for debugging purposes
      console.log("Email check result:", result);
    } catch (error) {
      console.error("Error checking email:", error);
      toast.error(
        "There was an error processing your request. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthButtonClick = (
    provider: "google" | "apple" | "facebook"
  ) => {
    onOAuthClick(provider);
  };

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(onSubmit)}
        noValidate
        className="email-auth"
      >
        <div className="d-flex flex-column align-items-center justify-content-center email-auth__container">
          <div className="align-self-baseline register-form__header">
            <h1 className="register-form__logo">Goddess Within</h1>
            <h2 className="email-auth__title">Register or sign in</h2>
          </div>

          <Row className="email-auth__oauth-buttons w-100 gap-3 mt-4 mb-5">
            {oauthConfig?.appleEnabled !== false && (
              <Button
                variant="outline"
                text="Continue with Apple"
                textColor="#000"
                startAdornment={
                  <IconifyIcon
                    icon="ic:baseline-apple"
                    styles={{ fontSize: 25 }}
                  />
                }
                onClick={() => handleOAuthButtonClick("apple")}
                disabled={isLoading}
              />
            )}

            {oauthConfig?.googleEnabled !== false && (
              <Button
                variant="outline"
                text="Continue with Google"
                textColor="#000"
                startAdornment={
                  <IconifyIcon
                    icon="flat-color-icons:google"
                    styles={{ fontSize: 20 }}
                  />
                }
                fullWidth
                onClick={() => handleOAuthButtonClick("google")}
                disabled={isLoading}
              />
            )}

            {oauthConfig?.facebookEnabled !== false && (
              <Button
                variant="outline"
                text="Continue with Facebook"
                textColor="#000"
                startAdornment={
                  <IconifyIcon
                    icon="logos:facebook"
                    styles={{ fontSize: 18 }}
                  />
                }
                fullWidth
                onClick={() => handleOAuthButtonClick("facebook")}
                disabled={isLoading}
              />
            )}
          </Row>

          <FormInput
            name="email"
            labelText="Email Address"
            placeholder="Enter your email"
            fullWidth
          />
          <Button
            type="submit"
            variant="primary"
            text="Continue"
            size="large"
            disabled={isLoading}
            fullWidth
            className="mt-4"
          />

          <p className="register-form__disclaimer mt-4">
            By registering for an account, you agree to our{" "}
            <CustomLink to="" className="register-form__disclaimer-link">
              Terms of Use
            </CustomLink>
            . Please read our{" "}
            <CustomLink to="" className="register-form__disclaimer-link">
              Privacy Notice
            </CustomLink>
            .
          </p>
        </div>
      </form>
    </FormProvider>
  );
};

export default EmailAuth;
