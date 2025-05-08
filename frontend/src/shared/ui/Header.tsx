import DevPilotLogoWithoutTitle from '../../assets/devPilot-logo-without-title.svg?react';
import Breadcrumbs from '@/widgets/Breadcrumb';

const Header = () => {
  return (
    <div className="flex max-h-20 flex-col">
      <div className="relative flex flex-row items-center bg-gray-200">
        <DevPilotLogoWithoutTitle className="h-10 w-10" />
        <h1>DevPilot</h1>
      </div>
      <div className="sticky top-0 z-10 bg-white px-4 py-2 shadow">
        <Breadcrumbs />
      </div>
    </div>
  );
};

export default Header;
