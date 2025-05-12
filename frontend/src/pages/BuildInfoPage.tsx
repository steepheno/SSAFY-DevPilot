import { CircleCheck, CircleXIcon } from 'lucide-react';
import { useState } from 'react';

const BuildInfoPage = () => {
  const [buildStatus, setBuildStatus] = useState({
    projectName: '프젝임',
    isBuildSuccess: false,
  });

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-1">
        {buildStatus.isBuildSuccess ? <CircleCheck color="green" /> : <CircleXIcon color="red" />}
        <h2 className="">{buildStatus.projectName}</h2>
      </div>

      <h3 className="font-semibold">고정 링크</h3>
      <ul className="list-inside list-disc pl-4">
        <li>
          <a href="">last build: 링크임</a>
        </li>
        <li>
          <a>last failed build: 링크임</a>
        </li>
        <li>
          <a>last unsuccessful build: 링크임</a>
        </li>
        <li>
          <a>last complted build: 링크임</a>
        </li>
      </ul>
    </div>
  );
};

export default BuildInfoPage;
