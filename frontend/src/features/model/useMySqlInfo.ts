import { useState } from 'react';

export const useMySqlInfo = () => {
  const [mysqlVersion, setMysqlVersion] = useState('');
  const [mysqlRootPassword, setMysqlRootPassword] = useState('');
  const [mysqlDatabase, setMysqlDatabase] = useState('');
  const [mysqlUser, setMysqlUser] = useState('');
  const [mysqlPassword, setMysqlPassword] = useState('');

  const validateMySqlInfo = () => {
    if (!mysqlVersion || !mysqlRootPassword || !mysqlDatabase || !mysqlUser || !mysqlPassword) {
      alert('MySQL 정보를 모두 입력해주세요.');
      return false;
    }
    return true;
  };

  const getMySqlInfoConfig = () => {
    return {
      mysqlVersion,
      mysqlRootPassword,
      mysqlDatabase,
      mysqlUser,
      mysqlPassword,
    };
  };

  return {
    mysqlVersion,
    setMysqlVersion,
    mysqlRootPassword,
    setMysqlRootPassword,
    mysqlDatabase,
    setMysqlDatabase,
    mysqlUser,
    setMysqlUser,
    mysqlPassword,
    setMysqlPassword,
    validateMySqlInfo,
    getMySqlInfoConfig,
  };
};
