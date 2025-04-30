import DevPilotLogoWithoutTitle from "../../assets/devPilot-logo-without-title.svg?react";

const Header = () => {
  return (
    <>
      <div className=" max-h-20 flex flex-col">
        <div className="bg-gray-200 relative flex flex-row items-center">
          <DevPilotLogoWithoutTitle className="w-10 h-10" />
          <h1>DevPilot</h1>
        </div>
        <div className="sticky top-0">Nav</div>
      </div>
    </>
  );
};

export default Header;
