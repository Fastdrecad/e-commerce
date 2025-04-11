import { AppRoot } from "@/app/routes/route";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

const createAppRouter = () =>
  createBrowserRouter([
    {
      path: "*",
      element: <AppRoot />
    }
  ]);

export function AppRouter() {
  const router = createAppRouter();

  return <RouterProvider router={router} />;
}
