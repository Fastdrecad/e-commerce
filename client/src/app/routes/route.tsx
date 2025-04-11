import MainLayout from "@/components/layout/MainLayout";
import { Outlet } from "react-router-dom";

export const AppRoot = () => {
  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );
};
