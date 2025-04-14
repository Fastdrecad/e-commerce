import React from "react";
import { UncontrolledTooltip } from "reactstrap";

interface TooltipProps {
  target: string;
  placement?: "top" | "bottom" | "left" | "right";
  children: React.ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({
  target,
  placement = "top",
  children
}) => {
  return (
    <UncontrolledTooltip placement={placement} target={target}>
      {children}
    </UncontrolledTooltip>
  );
};

export default Tooltip;
