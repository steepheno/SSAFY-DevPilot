import Home from '@/assets/icons/home.svg?react';
import CreateBuild from '@/assets/icons/createbuild.svg?react';
import BuildLog from '@/assets/icons/buildlog.svg?react';
import MyInfo from '@/assets/icons/myinfo.svg?react';
import MyWork from '@/assets/icons/mywork.svg?react';
import Settings from '@/assets/icons/settings.svg?react';
import { useNavigate } from 'react-router-dom';

// SidebarItem 타입 정의
type SidebarItemProps = {
  item: {
    name: string;
    icon: React.ReactNode;
    path: string;
  };
  onClick?: () => void;
};

const Sidebar = () => {
  const navigate = useNavigate();

  const sidebarItems = [
    { name: '홈', icon: <Home />, path: '/' },
    { name: '빌드 생성', icon: <CreateBuild />, path: '/new/repository' },
    { name: '빌드 기록', icon: <BuildLog />, path: '/' },
    { name: '내 정보', icon: <MyInfo />, path: '/' },
    { name: '내 작업 목록', icon: <MyWork />, path: '/' },
    { name: '설정', icon: <Settings />, path: '/' },
  ];

  const navigateTo = (path: string) => {
    if (path) {
      navigate(path);
    }
  };

  return (
    <>
      <div className="sticky left-0 flex w-60 flex-col shadow-[5px_0_10px_-5px_rgba(0,0,0,0.1)]">
        {sidebarItems.map((item, index) => (
          <SidebarItem key={index} item={item} onClick={() => navigateTo(item.path)} />
        ))}
      </div>
    </>
  );
};

const SidebarItem = ({ item, onClick }: SidebarItemProps) => {
  return (
    <>
      <div className="ml-2 mt-2 flex h-10 w-full cursor-pointer p-2" onClick={onClick}>
        <span className="mr-2">{item.icon}</span>
        <span className="">{item.name}</span>
      </div>
    </>
  );
};

export default Sidebar;
