import React from "react";

type MainLayoutProps = {
  children: React.ReactNode;
};

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="d-flex flex-column min-vh-100 justify-content-between">
      <div>Header</div>
      <main>{children} Main Content</main>
      <div>Footer</div>
    </div>
  );
};

export default MainLayout;
