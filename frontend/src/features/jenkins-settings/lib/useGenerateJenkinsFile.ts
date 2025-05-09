import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateJenkinsFile } from '@/entities/jenkinsFile/api/generateJenkinsfile';
import type { JenkinsConfig } from '@/entities/jenkinsFile/types/';

export function useGenerateJenkinsFile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(
    async (request: JenkinsConfig) => {
      setLoading(true);
      setError(null);
      try {
        await generateJenkinsFile(request);
        navigate('/new/environment');
      } catch (e: any) {
        setError(e.message ?? '알 수 없는 에러');
      } finally {
        setLoading(false);
      }
    },
    [navigate],
  );

  return { generate, loading, error };
}
