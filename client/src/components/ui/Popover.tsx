import React from "react";
import { UncontrolledPopover, PopoverHeader, PopoverBody } from "reactstrap";

interface PopoverProps {
  target: string; // Make target a required string
  placement?: "top" | "bottom" | "left" | "right";
  popoverTitle?: string;
  children: React.ReactNode;
}

const Popover: React.FC<PopoverProps> = ({
  target,
  placement = "top",
  popoverTitle,
  children
}) => {
  return (
    <UncontrolledPopover placement={placement} target={target} trigger="legacy">
      {popoverTitle && <PopoverHeader>{popoverTitle}</PopoverHeader>}
      <PopoverBody>{children}</PopoverBody>
    </UncontrolledPopover>
  );
};

export default Popover;
