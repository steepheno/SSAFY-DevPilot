import DevPilotLogoWithoutTitle from '@/assets/devPilot-logo-without-title-white.svg?react';
import Breadcrumbs from '@/widgets/Breadcrumb.tsx';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const navigate = useNavigate();

  const goToMain = () => {
    navigate('/');
  };

  return (
    <div className="flex max-h-20 flex-col">
      <div className="relative flex flex-row items-center bg-p5">
        <DevPilotLogoWithoutTitle className="h-14 w-14 cursor-pointer" onClick={goToMain} />
        <h1 className="cursor-pointer pl-1 text-h3 font-bold text-g2" onClick={goToMain}>
          DevPilot
        </h1>
      </div>
      <div className="sticky top-0 z-10 bg-white px-4 py-2 shadow">
        <Breadcrumbs />
      </div>
    </div>
  );
};

export default Header;
