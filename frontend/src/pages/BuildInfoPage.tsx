import { fetchJobInfo } from '@/entities/build/api.ts';
import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import BuildList from './buildLog/ui/BuildList';
import { Job } from '@/features/jobs/types';

// type LocationState = {
//   job?: Job;
// };

const BuildInfoPage = () => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const location = useLocation();
  const navigate = useNavigate();
  const { buildId } = useParams<{ buildId: string }>();
  const [job, setJob] = useState<Job | null>(null);

  useEffect(() => {
    const loadBuildInfo = async () => {
      if (!location.state.name) {
        setError('Job 정보가 제공되지 않았습니다.');
        return;
      }
      if (!job || !buildId) return;
      setIsLoading(true);
      try {
        const response = await fetchJobInfo(job.name);
        if (response?.data) {
          setJob(location.state);
        } else {
          setError('Build 정보를 가져올 수 없습니다.');
        }
      } catch (err) {
        console.error(err);
        setError('Build 조회 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };
    loadBuildInfo();
  }, [job, location.state, buildId]);

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }
  if (!job) {
    navigate('/builds');
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="text-gray-600">빌드 정보를 불러오는 중...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <h2 className="text-lg font-semibold">{location.state.name}</h2>
      <BuildList />
    </div>
  );
};

export default BuildInfoPage;
