import { useState } from 'react';

export const useProjectEnvironment = () => {
  const [useGradle, setUseGradle] = useState(false);
  const [useMaven, setUseMaven] = useState(false);
  const [useNginx, setUseNginx] = useState(false);
  const [useRedis, setUseRedis] = useState(false);
  const [useMysql, setUseMysql] = useState(false);

  const getProjectEnvironmentConfig = () => {
    return {
      useGradle,
      useMaven,
      useNginx,
      useRedis,
      useMysql,
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
    useMysql,
    setUseMysql,
    getProjectEnvironmentConfig,
  };
};
