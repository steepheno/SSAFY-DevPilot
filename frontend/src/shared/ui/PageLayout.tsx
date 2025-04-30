import { ReactNode } from "react";

import Header from "./Header";
import Sidebar from "./Sidebar";

const PageLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="h-screen overflow-y-auto">
      <Header />
      <div className="flex flex-row h-full">
        <Sidebar />
        <div className="flex-1 bg-green-400">{children}</div>
      </div>
    </div>
  );
};

export default PageLayout;
