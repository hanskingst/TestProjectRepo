import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { RouterProvider, createBrowserRouter } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import WelcomeScreen from "./components/WelcomeScreen.tsx";
import SignUpScreen from "./components/signUpScreen.tsx";
import LoginScreen from "./components/loginScreen.tsx";
import Dashboard from "./components/dashboard.tsx";

const queryClient = new QueryClient();
const provider = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "/",
        element: <WelcomeScreen />,
      },
      { path: "/signUpScreen", element: <SignUpScreen /> },
      { path: "/loginScreen", element: <LoginScreen /> },
      {
        path: "/dashboard",
        element: <Dashboard />,
        errorElement: (
          <div className="p-4 text-red-600">
            An error occured please try again
          </div>
        ),
      },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={provider} />
    </QueryClientProvider>
  </StrictMode>
);
