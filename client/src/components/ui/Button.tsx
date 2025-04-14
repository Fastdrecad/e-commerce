// import React from "react";
// import Popover from "@/components/ui/Popover";
// import Tooltip from "@/components/ui/Tooltip";

// type ButtonVariant =
//   | "primary"
//   | "secondary"
//   | "danger"
//   | "link"
//   | "dark"
//   | "none"
//   | "empty";
// type IconDirection = "left" | "right";
// type ButtonSize = "small" | "medium" | "large";

// interface ButtonProps {
//   id?: string;
//   size?: ButtonSize;
//   variant?: ButtonVariant;
//   tabIndex?: number;
//   ariaLabel?: string;
//   ariaExpanded?: boolean;
//   type?: "button" | "submit" | "reset";
//   disabled?: boolean;
//   className?: string;
//   text?: string;
//   role?: string;
//   icon?: React.ReactNode;
//   iconDirection?: IconDirection;
//   iconClassName?: string;
//   borderless?: boolean;
//   round?: number;
//   onClick?: React.MouseEventHandler<HTMLButtonElement>;
//   tooltip?: boolean;
//   tooltipContent?: string;
//   textColor?: string;
//   popover?: boolean;
//   popoverContent?: React.ReactNode;
//   popoverTitle?: string;
//   fullWidth?: boolean;
// }

// const variants: Record<ButtonVariant, string> = {
//   primary: "custom-btn-primary",
//   secondary: "custom-btn-secondary",
//   danger: "custom-btn-danger",
//   link: "custom-btn-link",
//   dark: "custom-btn-dark",
//   none: "custom-btn-none",
//   empty: ""
// };

// const Button: React.FC<ButtonProps> = ({
//   id,
//   size = "medium",
//   variant = "primary",
//   tabIndex,
//   ariaLabel,
//   ariaExpanded,
//   type = "button",
//   disabled = false,
//   className = "",
//   text,
//   role,
//   icon,
//   iconDirection = "left",
//   iconClassName,
//   borderless = false,
//   round,
//   onClick,
//   tooltip,
//   tooltipContent,
//   textColor,
//   popover,
//   popoverContent,
//   popoverTitle,
//   fullWidth
// }) => {
//   const btnVariant = variant ? variants[variant] : "";
//   const btnType =
//     icon && text ? "with-icon" : icon && !text ? "icon-only" : "text-only";

//   const classNames = `input-btn ${className} ${btnVariant} ${size} ${btnType} ${
//     iconDirection === "left" ? "icon-left" : "icon-right"
//   } ${borderless ? "border-0" : ""} ${disabled ? "disabled" : ""} ${
//     fullWidth ? "full-width" : ""
//   }`;

//   const iconClassNames = `btn-icon ${iconClassName || ""}`;
//   const tooltipId = tooltip
//     ? `tooltip-${id || Math.random().toString(36).substring(2)}`
//     : id || "";
//   const popoverId = popover
//     ? `popover-${id || Math.random().toString(36).substring(2)}`
//     : id || "";
//   const btnId = tooltip ? tooltipId : popoverId;

//   const style = round ? { borderRadius: `${round}px` } : {};
//   const textClassName = textColor ? textColor : "btn-text";

//   return (
//     <button
//       id={btnId}
//       tabIndex={tabIndex}
//       aria-label={ariaLabel}
//       aria-expanded={ariaExpanded}
//       role={role}
//       disabled={disabled}
//       className={classNames}
//       type={type}
//       onClick={onClick}
//       style={style}
//     >
//       {tooltip && <Tooltip target={tooltipId}>{tooltipContent}</Tooltip>}
//       {popover && (
//         <Popover target={popoverId} popoverTitle={popoverTitle}>
//           {popoverContent}
//         </Popover>
//       )}
//       {iconDirection === "left" ? (
//         <>
//           {icon && <div className={iconClassNames}>{icon}</div>}
//           {text && <span className={textClassName}>{text}</span>}
//         </>
//       ) : (
//         <>
//           {text && <span className={textClassName}>{text}</span>}
//           {icon && <div className={iconClassNames}>{icon}</div>}
//         </>
//       )}
//     </button>
//   );
// };

// export default Button;

import React from "react";
import Popover from "@/components/ui/Popover";
import Tooltip from "@/components/ui/Tooltip";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "danger"
  | "link"
  | "dark"
  | "none"
  | "empty"
  | "outline";

type ButtonSize = "small" | "medium" | "large";

interface ButtonProps {
  id?: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
  tabIndex?: number;
  ariaLabel?: string;
  ariaExpanded?: boolean;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  className?: string;
  text?: string;
  role?: string;
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
  iconOnly?: boolean;
  borderless?: boolean;
  round?: number;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  tooltip?: boolean;
  tooltipContent?: string;
  textColor?: string;
  popover?: boolean;
  popoverContent?: React.ReactNode;
  popoverTitle?: string;
  fullWidth?: boolean;
}

const variants: Record<ButtonVariant, string> = {
  primary: "custom-btn-primary",
  secondary: "custom-btn-secondary",
  danger: "custom-btn-danger",
  link: "custom-btn-link",
  dark: "custom-btn-dark",
  none: "custom-btn-none",
  empty: "",
  outline: "custom-btn-outline"
};

const Button: React.FC<ButtonProps> = ({
  id,
  size = "medium",
  variant = "primary",
  tabIndex,
  ariaLabel,
  ariaExpanded,
  type = "button",
  disabled = false,
  className = "",
  text,
  role,
  startAdornment,
  endAdornment,
  iconOnly = false,
  borderless = false,
  round,
  onClick,
  tooltip,
  tooltipContent,
  textColor,
  popover,
  popoverContent,
  popoverTitle,
  fullWidth,
  ...props
}) => {
  const btnVariant = variants[variant] || "";
  const contentType = iconOnly ? "icon-only" : text ? "with-text" : "text-only";

  const classes = `
    input-btn 
    ${className}
    ${btnVariant}
    ${size}
    ${contentType}
    ${borderless ? "border-0" : ""}
    ${disabled ? "disabled" : ""}
    ${fullWidth ? "full-width" : ""}
  `.trim();

  const tooltipId = tooltip ? `tooltip-${id || crypto.randomUUID()}` : id || "";
  const popoverId = popover ? `popover-${id || crypto.randomUUID()}` : id || "";
  const btnId = tooltip ? tooltipId : popoverId;
  const style = round ? { borderRadius: `${round}px` } : {};
  const textClassName = textColor || "btn-text";

  return (
    <button
      {...props}
      id={btnId}
      tabIndex={tabIndex}
      aria-label={ariaLabel}
      aria-expanded={ariaExpanded}
      role={role}
      disabled={disabled}
      className={classes}
      type={type}
      onClick={onClick}
      style={style}
    >
      {tooltip && <Tooltip target={tooltipId}>{tooltipContent}</Tooltip>}
      {popover && (
        <Popover target={popoverId} popoverTitle={popoverTitle}>
          {popoverContent}
        </Popover>
      )}
      {startAdornment && (
        <span className="btn-icon start">{startAdornment}</span>
      )}
      {text && <span className={textClassName}>{text}</span>}
      {endAdornment && <span className="btn-icon end">{endAdornment}</span>}
    </button>
  );
};

export default Button;
