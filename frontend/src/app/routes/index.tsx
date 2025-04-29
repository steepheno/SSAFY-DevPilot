import { createBrowserRouter } from "react-router-dom";
import Main from "@/pages/ui/Main";
import RepositorySettings from "@/pages/ui/RepositorySettings";
import EnvironmentSettings from "@/pages/ui/EnvironmentSettings";
import Configure from "@/pages/ui/Configure";

const Router = createBrowserRouter([
  {
    path: "/",
    element: <Main />,
  },
  {
    path: "/new",
    children: [
      {
        path: "repository",
        element: <RepositorySettings />,
      },
      {
        path: "environment",
        element: <EnvironmentSettings />,
      },
      {
        path: "configure",
        element: <Configure />,
      },
    ],
  },
]);

export default Router;
