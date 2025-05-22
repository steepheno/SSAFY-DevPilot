import Home from '@/assets/icons/home.svg?react';
import CreateBuild from '@/assets/icons/createbuild.svg?react';
import BuildLog from '@/assets/icons/buildlog.svg?react';
import Settings from '@/assets/icons/settings.svg?react';
import { useLocation, useNavigate } from 'react-router-dom';

// SidebarItem 타입 정의
type SidebarItemProps = {
  item: { name: string; icon: React.ReactNode; path: string; activePath?: string };
  isActive: boolean;
  onClick?: () => void;
};

const sidebarItems = [
  { name: '대시보드', icon: <Home />, path: '/' },
  { name: '새 프로젝트', icon: <CreateBuild />, path: '/new/repository', activePath: '/new' },
  { name: '설정', icon: <Settings />, path: '/preferences' },
];

const SidebarItem = ({ item, isActive, onClick }: SidebarItemProps) => {
  return (
    <div
      className={`mt-2 flex h-10 w-full cursor-pointer rounded-md p-2 pl-2 transition-colors ${isActive ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
      onClick={onClick}
    >
      <span className={`mr-2 ${isActive ? 'text-blue-600' : ''}`}>{item.icon}</span>
      <span className={`hidden md:inline ${isActive ? 'font-medium' : ''}`}>{item.name}</span>
    </div>
  );
};

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const navigateTo = (path: string) => {
    if (path) navigate(path);
  };

  // 현재 경로가 메뉴 항목의 경로로 시작하는지 확인
  const isActive = (item: (typeof sidebarItems)[0]) => {
    // 활성화 확인용 경로를 사용하거나 없으면 기본 경로 사용
    const pathToCheck = item.activePath || item.path;

    if (pathToCheck === '/') {
      // 홈 경로는 정확히 일치할 때만 활성화
      return currentPath === '/';
    }
    // 다른 경로는 부분 경로 매칭
    return currentPath.startsWith(pathToCheck);
  };

  return (
    <div className="inset-y-0 mt-5 flex w-14 flex-col md:w-60 md:min-w-[00px]">
      {sidebarItems.map((item, index) => (
        <SidebarItem
          key={index}
          item={item}
          isActive={isActive(item)}
          onClick={() => navigateTo(item.path)}
        />
      ))}
    </div>
  );
};

export default Sidebar;
