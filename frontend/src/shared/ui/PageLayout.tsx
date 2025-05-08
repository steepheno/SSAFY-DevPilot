import { ReactNode } from 'react';

import Header from './Header';
import Sidebar from './Sidebar';

const PageLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="min-h-screen overflow-y-auto">
      <header className="fixed left-0 right-0 top-0 z-50 h-16 bg-white shadow">
        <Header />
      </header>
      <div className="flex flex-1">
        <aside className="fixed bottom-0 left-0 top-20 z-40 w-14 bg-white shadow md:w-60">
          <Sidebar />
        </aside>

        <main className="absolute bottom-0 left-14 right-0 top-16 overflow-auto bg-gray-50 p-6 md:left-60">
          {children}
        </main>
      </div>
    </div>
  );
};

export default PageLayout;
