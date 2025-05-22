import Header from './Header.tsx';
import Sidebar from './Sidebar.tsx';
import ChatbotButton from '@/widgets/chatbot/ChatbotButton.tsx';
import { Outlet } from 'react-router-dom';

const PageLayout = () => {
  return (
    <div className="min-h-screen overflow-y-auto">
      <header className="fixed left-0 right-0 top-0 z-50 h-20 bg-white shadow">
        <Header />
      </header>
      <div className="flex flex-1">
        <aside className="fixed bottom-0 left-0 top-20 z-40 w-14 bg-white shadow-lg md:w-60">
          <Sidebar />
        </aside>

        <main className="absolute bottom-0 left-14 right-0 top-20 min-w-[700px] overflow-auto p-6 px-10 py-10 md:left-60">
          <Outlet />
        </main>
      </div>
      <ChatbotButton />
    </div>
  );
};

export default PageLayout;
