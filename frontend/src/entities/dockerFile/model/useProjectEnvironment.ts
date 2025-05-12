import { useState } from 'react';

export const useProjectEnvironment = () => {
  const [useGradle, setUseGradle] = useState(false);
  const [useMaven, setUseMaven] = useState(false);
  const [useNginx, setUseNginx] = useState(false);
  const [useRedis, setUseRedis] = useState(false);
  const [useMySQL, setUseMySQL] = useState(false);

  const getProjectEnvironmentConfig = () => {
    return {
      useGradle,
      useMaven,
      useNginx,
      useRedis,
      useMySQL,
    };
  };

  return {
    useGradle,
    setUseGradle,
    useMaven,
    setUseMaven,
    useNginx,
    setUseNginx,
    useRedis,
    setUseRedis,
    useMySQL,
    setUseMySQL,
    getProjectEnvironmentConfig,
  };
};
