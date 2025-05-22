import { useEffect } from 'react';
import { useJobs } from '@/features/jobs/model/useJobs';
import { Link, useParams } from 'react-router';
import { formatTimestamp, formatDuration } from '@/shared/lib/time';
import LoadingSpinner from '@/shared/ui/lottie/LoadingSpinner';

export interface BuildListProps {
  jobName: string;
}

// 빌드 리스트 항목 타입 정의
export interface BuildEntry {
  number: string;
  result: string;
  timestamp: number;
  duration: number;
}

const BuildList = () => {
  const { jobName } = useParams<'jobName'>();
  const { builds, buildsError, isBuildsLoading, refetchBuilds } = useJobs(jobName!);

  const headers = ['빌드 번호', '상태', '빌드 시작 시각', '경과 시간'];

  useEffect(() => {
    refetchBuilds();
  }, [jobName, refetchBuilds]);

  if (isBuildsLoading) {
    return <LoadingSpinner />;
  }

  return (
    <>
      {/* <h2 className="text-lg font-semibold">{location.state.name}</h2> */}
      <table className="w-full table-fixed border-separate border-spacing-0 pt-5">
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
          {buildsError ? (
            // 에러가 있을 때
            <tr>
              <td colSpan={headers.length} className="border p-2 text-center text-red-500">
                빌드 정보를 불러오는 중 오류가 발생했습니다.
              </td>
            </tr>
          ) : builds && builds.length > 0 ? (
            // 에러 없고 빌드가 있을 때
            builds.map((b: BuildEntry) => (
              <tr key={b.number} className="align-middle">
                <td className="border p-2 text-center">
                  <Link to={`${b.number}`}>#{b.number}</Link>
                </td>
                <td className="border p-2 text-center">{b.result}</td>
                <td className="border p-2 text-center">{formatTimestamp(b.timestamp)}</td>
                <td className="border p-2 text-center">{formatDuration(b.duration)}</td>
              </tr>
            ))
          ) : (
            // 에러 없고 빌드 데이터가 없을 때
            <tr>
              <td colSpan={headers.length} className="border p-2 text-center text-gray-500">
                빌드 정보가 없습니다. 원격 브랜치의 target 브랜치에 push 이벤트 발생 시 새 빌드가
                진행됩니다.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  );
};

export default BuildList;
