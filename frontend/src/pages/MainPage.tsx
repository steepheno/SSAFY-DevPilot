import DetailButton from '@/shared/ui/DetailButton.tsx';
import DetailInput from '@/shared/ui/DetailInput.tsx';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  CircleCheckIcon,
  CircleEllipsisIcon,
  CircleXIcon,
  SquareArrowOutUpRight,
  SquareArrowUpRight,
} from 'lucide-react';
import { Job } from '@/features/jobs/types';
import { getJobsInfo } from '@/features/jobs/api';

interface CellProps {
  children: React.ReactNode;
}
const Cell: React.FC<CellProps> = ({ children }) => (
  <td className="h-16 border border-gray-300 p-2 text-center align-middle">{children}</td>
);

const iconMap: Record<Job['color'], JSX.Element> = {
  red: <CircleXIcon size={20} color="red" className="mx-auto" />,
  red_anime: <CircleXIcon size={20} color="red" className="mx-auto animate-pulse" />,
  yellow: <CircleEllipsisIcon size={20} color="yellow" className="mx-auto" />,
  yellow_anime: <CircleEllipsisIcon size={20} color="yellow" className="mx-auto animate-pulse" />,
  blue: <CircleCheckIcon size={20} color="blue" className="mx-auto" />,
  blue_anime: <CircleCheckIcon size={20} color="blue" className="mx-auto animate-pulse" />,
  grey: <CircleEllipsisIcon size={20} color="grey" className="mx-auto" />,
  grey_anime: <CircleEllipsisIcon size={20} color="grey" className="mx-auto animate-pulse" />,
  disabled: <CircleEllipsisIcon size={20} color="grey" className="mx-auto" />,
  disabled_anime: <CircleEllipsisIcon size={20} color="grey" className="mx-auto animate-pulse" />,
  aborted: <CircleXIcon size={20} color="black" className="mx-auto" />,
  aborted_anime: <CircleXIcon size={20} color="black" className="mx-auto animate-pulse" />,
  notbuilt: <CircleEllipsisIcon size={20} color="black" className="mx-auto" />,
  notbuilt_anime: <CircleEllipsisIcon size={20} color="black" className="mx-auto animate-pulse" />,
};

const MainPage: React.FC = () => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [text, setText] = useState('');
  const [savedText, setSavedText] = useState('');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    getJobsInfo()
      .then((data) => setJobs(data.jobs))
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="text-gray-600">로딩 중...</span>
      </div>
    );
  }

  const submitTitle = () => {
    setSavedText(text);
    setIsEditMode(false);
  };

  const renderStatus = (color: Job['color']) => {
    if (color.startsWith('blue')) return '성공';
    if (color.startsWith('red')) return '실패';
    return '빌드 전';
  };

  return (
    <>
      {jobs.length === 0 ? (
        <div className="flex h-64 items-center justify-center">
          <span className="text-gray-600">최근 진행 빌드가 없습니다.</span>
        </div>
      ) : (
        <>
          <h2 className="mb-4 text-2xl font-bold">프로젝트 목록</h2>

          {/* 테이블 */}
          <table className="w-full table-fixed border-separate border-spacing-0 overflow-hidden rounded-lg border">
            <thead>
              <tr className="bg-gray-700 align-middle text-white">
                <th className="h-12 p-2 text-center">최근 상태</th>
                <th className="h-12 p-2 text-center">프로젝트 이름</th>
                <th className="h-12 p-2 text-center">로그</th>
                <th className="h-12 p-2 text-center">최근 빌드</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => {
                const jobLink = (
                  <Link
                    to={`builds/${job.name}`}
                    state={job}
                    className="text-blue-500 hover:underline"
                  >
                    {job.name}
                  </Link>
                );

                return (
                  <tr key={job.name} className="align-middle odd:bg-white even:bg-gray-50">
                    <Cell>
                      <div className="flex flex-col items-center">
                        {iconMap[job.color]}
                        <span className="mt-1 text-sm">{renderStatus(job.color)}</span>
                      </div>
                    </Cell>
                    <Cell>{jobLink}</Cell>
                    <Cell>
                      <SquareArrowOutUpRight
                        size={25}
                        color="gray"
                        className="mx-auto cursor-pointer"
                      />
                    </Cell>
                    <Cell>
                      <a>#67</a>
                    </Cell>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      )}
    </>
  );
};

export default MainPage;
