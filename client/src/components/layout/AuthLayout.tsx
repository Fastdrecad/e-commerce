import { Col } from "reactstrap";

type AuthLayoutProps = {
  children?: React.ReactNode;
};

export const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <Col
      className="min-vh-100 align-items-baseline mx-auto pb-5 pt-5"
      style={{ maxWidth: "420px", width: "95%" }}
    >
      {children}
    </Col>
  );
};
