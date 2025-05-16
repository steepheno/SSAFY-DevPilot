import { LogIn } from 'lucide-react';
import { Job } from '@/features/jobs/types';

// 빌드 리스트 항목 타입 정의
interface BuildEntry {
  number: string;
  duration: string;
  status: string;
  logUrl: string;
}

// BuildList 컴포넌트: job 정보와 빌드 배열을 받아 동적 렌더링
interface BuildListProps {
  job?: Job;
  builds: BuildEntry[];
}

const BuildList = () => {
  // 컬럼 헤더 설정
  const headers = ['빌드 번호', '상태', '경과 시간', '로그'];

  const builds = [
    {
      number: 1,
      duration: 1,
      status: '성공',
    },

    {
      number: 2,
      duration: 1,
      status: '성공',
    },
    {
      number: 3,
      duration: 1,
      status: '성공',
    },
    {
      number: 4,
      duration: 1,
      status: '성공',
    },
  ];
  return (
    <>
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
          {builds.length > 0 ? (
            builds.map((b) => (
              <tr key={b.number} className="align-middle">
                <td className="border p-2 text-center align-middle">#{b.number}</td>
                <td className="border p-2 text-center align-middle">{b.status}</td>
                <td className="border p-2 text-center align-middle">{b.duration}</td>
                <td className="border p-2 text-center align-middle">
                  <LogIn
                    size={20}
                    className="mx-auto cursor-pointer"
                    onClick={() => window.open(b.logUrl, '_blank')}
                  />
                </td>
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
