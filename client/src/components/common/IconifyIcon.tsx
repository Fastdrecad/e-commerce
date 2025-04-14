import { Icon, IconProps } from "@iconify/react";

interface IconifyProps {
  icon: IconProps["icon"];
  styles?: React.CSSProperties;
}

const IconifyIcon = ({ icon, styles, ...rest }: IconifyProps) => {
  return (
    <span
      style={{
        display: "inline-flex",
        ...styles
      }}
      {...rest}
    >
      <Icon icon={icon} />
    </span>
  );
};

export default IconifyIcon;
