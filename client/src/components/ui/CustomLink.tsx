import { Link } from "react-router-dom";

interface CustomLinkProps {
  to?: string;
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  isExternal?: boolean;
  disabled?: boolean;
  tooltip?: string;
  ariaLabel?: string;
  onClick?: (
    e: React.MouseEvent<HTMLAnchorElement | HTMLSpanElement, MouseEvent>
  ) => void;
}

const CustomLink = ({
  to,
  children,
  className = "",
  icon,
  iconPosition = "left",
  isExternal = false,
  disabled = false,
  tooltip,
  ariaLabel,
  onClick
}: CustomLinkProps) => {
  const content = (
    <span className={`link-content ${icon ? "with-icon" : ""}`}>
      {icon && iconPosition === "left" && (
        <span className="link-icon">{icon}</span>
      )}
      <span>{children}</span>
      {icon && iconPosition === "right" && (
        <span className="link-icon">{icon}</span>
      )}
    </span>
  );

  if (disabled) {
    return (
      <span
        className={`custom-link disabled ${className}`}
        aria-disabled="true"
        title={tooltip}
      >
        {content}
      </span>
    );
  }

  if (isExternal) {
    return (
      <a
        href={to}
        className={`custom-link ${className}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={ariaLabel}
        title={tooltip}
        onClick={onClick}
      >
        {content}
      </a>
    );
  }

  return (
    <Link
      to={to || ""}
      className={`custom-link ${className}`}
      aria-label={ariaLabel}
      title={tooltip}
      onClick={onClick}
    >
      {content}
    </Link>
  );
};

export default CustomLink;
