import { createBrowserRouter } from "react-router-dom";
import Main from "@/pages/ui/Main";
import RepositorySettings from "@/pages/ui/RepositorySettings";
import EnvironmentSettings from "@/pages/ui/EnvironmentSettings";
import Configure from "@/pages/ui/Configure";
import NewBuildPage from "@/pages/ui/NewBuild";

const Router = createBrowserRouter([
  {
    path: "/",
    handle: { breadcrumb: "홈" },
    element: <Main />,
  },
  {
    path: "/new",
    handle: { breadcrumb: "새 빌드" },
    element: <NewBuildPage />,
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
