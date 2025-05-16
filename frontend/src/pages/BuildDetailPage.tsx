import { useState } from 'react';
import { CircleCheck, CircleEllipsis, CircleXIcon } from 'lucide-react';
import { BuildStatus } from '@/entities/build/types';

const BuildDetailPage = () => {
  const [buildStatus] = useState<BuildStatus | null>(null);
  return (
    <>
      <div className="flex items-center gap-1">
        {buildStatus?.result === 'SUCCESS' ? (
          <CircleCheck color="green" />
        ) : buildStatus?.result === 'FAILURE' ? (
          <CircleXIcon color="red" />
        ) : (
          <CircleEllipsis color="blue" />
        )}
        <h2 className="text-lg font-semibold">
          {buildStatus?.fullDisplayName || '빌드 정보가 없습니다.'}
        </h2>
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
    </>
  );
};

export default BuildDetailPage;
