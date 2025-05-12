import { CircleCheck, CircleEllipsis, CircleXIcon } from 'lucide-react';
import { BuildStatus } from '@/entities/build/types';
import { useEffect, useState } from 'react';
import { fetchBuildInfo } from '@/entities/build/api';

const BuildInfoPage = () => {
  const [buildStatus, setBuildStatus] = useState<BuildStatus>();

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetchBuildInfo('test', '1');
        setBuildStatus(response.data);
      } catch (err) {
        console.error(err);
      }
    };

    load(); // 함수 호출
  }, []);

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-1">
        {buildStatus?.result === 'SUCCESS' ? (
          <CircleCheck color="green" />
        ) : buildStatus?.result === 'FAILURE' ? (
          <CircleXIcon color="red" />
        ) : (
          <CircleEllipsis color="blue" />
        )}
        <h2 className="">{buildStatus?.fullDisplayName}</h2>
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
