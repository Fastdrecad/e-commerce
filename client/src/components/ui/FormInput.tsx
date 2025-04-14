import { Controller, useFormContext } from "react-hook-form";
import { useState } from "react";
import IconifyIcon from "@/components/common/IconifyIcon";

export interface FormInputProps {
  name: string;
  labelText?: string;
  type?: string;
  placeholder?: string;
  isMultiline?: boolean;
  rows?: number;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement> & {
    endAdornment?: React.ReactNode;
  };
  textareaProps?: React.TextareaHTMLAttributes<HTMLTextAreaElement>;
  className?: string;
  inputLimitation?: RegExp;
  onChange?: (value: string) => void;
  fullWidth?: boolean;
  showPasswordToggle?: boolean;
  readOnly?: boolean;
  value?: string;
  grayedOut?: boolean;
}

export const FormInput = ({
  name,
  labelText,
  type = "text",
  placeholder,
  isMultiline = false,
  rows = 3,
  inputProps = {},
  textareaProps = {},
  className = "",
  inputLimitation,
  onChange,
  fullWidth = false,
  showPasswordToggle = false,
  readOnly = false,
  value,
  grayedOut = false,
  ...props
}: FormInputProps) => {
  const { control, formState, clearErrors } = useFormContext();
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div
      className={`form-input ${className}`}
      style={{ width: fullWidth ? "100%" : "auto" }}
    >
      <Controller
        control={control}
        name={name}
        defaultValue=""
        render={({ field, fieldState }) => {
          const { error } = fieldState;
          const isSubmitted = formState.isSubmitted;

          // Only show validation error styles when form has been submitted
          const showError = isSubmitted && error && !isFocused;
          const errorClassName = showError ? "invalid-message" : "";
          const styles = `input-box ${showError ? "invalid" : ""}`;

          const handleNumberInput = (value: string) => {
            return value === "" || /^[0-9]*\.?[0-9]*$/.test(value)
              ? value
              : field.value;
          };

          const handleInputChange = (
            e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
          ) => {
            const value = e.target.value;
            if (inputLimitation && !inputLimitation.test(value)) {
              return;
            }
            if (onChange) {
              onChange(value);
            }
            if (type === "number") {
              const processedValue = handleNumberInput(
                value.slice(0, inputProps?.maxLength)
              );
              field.onChange(
                processedValue === "" ? "" : parseFloat(processedValue)
              );
            } else {
              field.onChange(value);
            }

            // Clear errors when user is typing
            clearErrors(name);
          };

          const handleFocus = () => {
            setIsFocused(true);
            clearErrors(name);
          };

          const handleBlur = () => {
            field.onBlur();
            setIsFocused(false);
          };

          // Extract endAdornment from inputProps to avoid passing it to the DOM element
          const { endAdornment, ...restInputProps } = inputProps;

          return (
            <>
              {isMultiline ? (
                <div className={styles}>
                  {labelText && <label htmlFor={name}>{labelText}</label>}
                  <textarea
                    id={name}
                    {...props}
                    {...field}
                    value={field.value || ""}
                    placeholder={placeholder}
                    rows={rows}
                    {...textareaProps}
                    onChange={handleInputChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                  />
                  {showError && (
                    <span className={errorClassName}>{error.message}</span>
                  )}
                </div>
              ) : (
                <div className={styles}>
                  <div className={grayedOut ? "opacity-25" : ""}>
                    {labelText && <label htmlFor={name}>{labelText}</label>}
                    <div className="input-wrapper">
                      <input
                        id={name}
                        {...props}
                        {...field}
                        value={value || field.value || ""}
                        type={
                          showPasswordToggle && showPassword ? "text" : type
                        }
                        placeholder={placeholder}
                        readOnly={readOnly}
                        {...restInputProps}
                        onChange={handleInputChange}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                      />

                      {showPasswordToggle && type === "password" && (
                        <button
                          type="button"
                          className="password-toggle"
                          onClick={togglePasswordVisibility}
                          tabIndex={-1}
                        >
                          {showPassword ? (
                            <IconifyIcon icon="mdi:eye-off" />
                          ) : (
                            <IconifyIcon icon="mdi:eye" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                  {endAdornment && (
                    <div className="input-adornment">{endAdornment}</div>
                  )}
                  {showError && (
                    <span className={errorClassName}>{error.message}</span>
                  )}
                </div>
              )}
            </>
          );
        }}
      />
    </div>
  );
};
