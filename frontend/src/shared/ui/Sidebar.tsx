const Sidebar = () => {
  const sidebarItems = [
    { name: "홈" },
    { name: "새 빌드" },
    { name: "내 정보" },
    { name: "내 작업 목록" },
    { name: "설정" },
  ];

  return (
    <>
      <div className="sticky left-0 flex  flex-col bg-blue-400 w-60">
        {sidebarItems.map((item, index) => (
          <SidebarItem key={index} item={item} />
        ))}
      </div>
    </>
  );
};

const SidebarItem = ({ item }) => {
  return (
    <>
      <li className="p-2 cursor-pointer w-full h-10">{item.name}</li>
    </>
  );
};

export default Sidebar;
