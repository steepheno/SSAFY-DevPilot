const BuildList = () => {
  return (
    <>
      <h1 className="px-5 py-10 text-h3 font-bold">Jenkins의 프로젝트</h1>
      <table className="w-full border-separate border-spacing-0 px-5 py-5">
        <thead>
          <tr>
            <th className="bg-gray-700 p-2 text-center text-white">날씨</th>
            <th className="bg-gray-700 p-2 text-center text-white">프로젝트 이름</th>
            <th className="bg-gray-700 p-2 text-center text-white">경과 시간</th>
            <th className="bg-gray-700 p-2 text-center text-white">상태</th>
            <th className="bg-gray-700 p-2 text-center text-white">로그</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-gray-300 p-2 text-center">실패</td>
            <td className="border border-gray-300 p-2 text-center">test</td>
            <td className="border border-gray-300 p-2 text-center">8.5 sec</td>
            <td className="border border-gray-300 p-2 text-center text-red-500">
              broken since this build
            </td>
            <td className="cursor-pointer border border-gray-300 p-2 text-center">아이콘</td>
          </tr>
          <tr>
            <td className="border border-gray-300 p-2 text-center">성공</td>
            <td className="border border-gray-300 p-2 text-center">test2</td>
            <td className="border border-gray-300 p-2 text-center">5 min</td>
            <td className="border border-gray-300 p-2 text-center">stable</td>
            <td className="cursor-pointer border border-gray-300 p-2 text-center">아이콘</td>
          </tr>
        </tbody>
      </table>
    </>
  );
};

export default BuildList;
