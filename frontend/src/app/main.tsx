import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import Router from "@/app/routes";
import "./index.css";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <RouterProvider router={Router} />,
);
