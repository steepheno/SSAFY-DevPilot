import { useJobs } from '@/features/jobs/model/useJobs';
import { Link, useParams, useLocation } from 'react-router';
import { LogIn } from 'lucide-react';
import { useEffect } from 'react';
import { formatTimestamp, formatDuration } from '@/shared/lib/time';

interface BuildListProps {
  jobName: string;
}

// 빌드 리스트 항목 타입 정의
interface BuildEntry {
  number: string;
  result: string;
  timestamp: number;
  duration: number;
}

const BuildList = () => {
  const { jobName } = useParams<'jobName'>();
  const location = useLocation();
  const { builds, isBuildsError, buildsError, isBuildsLoading } = useJobs(jobName!);

  const headers = ['빌드 번호', '상태', '빌드 시작 시각', '경과 시간'];

  return (
    <>
      {/* <h2 className="text-lg font-semibold">{location.state.name}</h2> */}
      <table className="w-full table-fixed border-separate border-spacing-0">
        <thead>
          <tr>
            {headers.map((title) => (
              <th key={title} className="bg-gray-700 p-2 text-center align-middle text-white">
                {title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {builds?.length > 0 ? (
            builds.map((b: any) => (
              <tr key={b.number} className="align-middle">
                <td className="border p-2 text-center align-middle">
                  <Link to={`${b.number}`}>#{b.number}</Link>
                </td>
                <td className="border p-2 text-center align-middle">{b.result}</td>
                <td className="border p-2 text-center align-middle">
                  {formatTimestamp(b.timestamp)}
                </td>
                <td className="border p-2 text-center align-middle">
                  {formatDuration(b.duration)}
                </td>
                {/* <td className="border p-2 text-center align-middle"> */}
                {/*   <LogIn */}
                {/*     size={20} */}
                {/*     className="mx-auto cursor-pointer" */}
                {/*     // onClick={() => window.open(b.logUrl, '_blank')} */}
                {/*   /> */}
                {/* </td> */}
              </tr>
            ))
          ) : (
            // 빌드 데이터가 없을 때 컬럼 수에 맞춰 빈 행 표시
            <tr className="align-middle">
              <td className="border p-2 text-center text-gray-500" colSpan={headers.length}>
                빌드 정보가 없습니다.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  );
};

export default BuildList;
