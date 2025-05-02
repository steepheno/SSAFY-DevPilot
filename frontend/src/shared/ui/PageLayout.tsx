import { ReactNode } from 'react';

import Header from './Header';
import Sidebar from './Sidebar';

const PageLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="h-screen overflow-y-auto">
      <Header />
      <div className="flex h-full flex-row">
        <Sidebar />
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
};

export default PageLayout;
