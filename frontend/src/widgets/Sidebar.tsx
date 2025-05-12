import Home from '@/assets/icons/home.svg?react';
import CreateBuild from '@/assets/icons/createbuild.svg?react';
import BuildLog from '@/assets/icons/buildlog.svg?react';
import MyInfo from '@/assets/icons/myinfo.svg?react';
import MyWork from '@/assets/icons/mywork.svg?react';
import Settings from '@/assets/icons/settings.svg?react';
import { useNavigate } from 'react-router-dom';

// SidebarItem 타입 정의
type SidebarItemProps = {
  item: { name: string; icon: React.ReactNode; path: string };
  onClick?: () => void;
};

const sidebarItems = [
  { name: '홈', icon: <Home />, path: '/' },
  { name: '빌드 생성', icon: <CreateBuild />, path: '/new/repository' },
  { name: '빌드 기록', icon: <BuildLog />, path: '/builds' },
  { name: '내 정보', icon: <MyInfo />, path: '/' },
  { name: '내 작업 목록', icon: <MyWork />, path: '/' },
  { name: '설정', icon: <Settings />, path: '/' },
];

const SidebarItem = ({ item, onClick }: SidebarItemProps) => {
  return (
    <div className="ml-2 mt-2 flex h-10 w-full cursor-pointer p-2" onClick={onClick}>
      <span className="mr-2">{item.icon}</span>
      <span className="hidden md:inline">{item.name}</span>
    </div>
  );
};

const Sidebar = () => {
  const navigate = useNavigate();
  const navigateTo = (path: string) => {
    if (path) navigate(path);
  };

  return (
    <div className="inset-y-0 mt-5 flex w-14 flex-col md:w-60 md:min-w-[00px]">
      {sidebarItems.map((item, index) => (
        <SidebarItem key={index} item={item} onClick={() => navigateTo(item.path)} />
      ))}
    </div>
  );
};

export default Sidebar;
