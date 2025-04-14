import React from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type AppProviderProps = {
  children?: React.ReactNode;
};

export function AppProvider({ children }: AppProviderProps) {
  return (
    <>
      {children}
      <ToastContainer pauseOnHover={false} onClick={() => toast.dismiss()} />
    </>
  );
}
