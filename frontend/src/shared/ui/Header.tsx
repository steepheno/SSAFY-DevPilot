import DevPilotLogoWithoutTitle from '@/assets/devPilot-logo-without-title-white.svg?react';
import Breadcrumbs from '@/widgets/Breadcrumb';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const navigate = useNavigate();

  const goToMain = () => {
    navigate('/');
  };

  return (
    <div className="flex max-h-20 flex-col">
      <div className="bg-p5 relative flex flex-row items-center">
        <DevPilotLogoWithoutTitle className="h-14 w-14 cursor-pointer" onClick={goToMain} />
        <h1 className="text-h3 text-g2 cursor-pointer pl-1 font-bold" onClick={goToMain}>
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
