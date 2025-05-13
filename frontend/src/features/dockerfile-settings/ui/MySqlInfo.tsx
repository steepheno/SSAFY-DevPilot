import { useFormStore } from '@/shared/store';

const MySqlInfo = () => {
  const { databaseConfig, setDatabaseConfig } = useFormStore();

  return (
    <div className="mb-10">
      <p className="text-xl font-bold">MySQL 설정</p>
      <div className="mt-3 flex">
        <p>버전</p>
        <input
          className="ml-5 h-[25px] w-[150px] rounded border px-2"
          value={databaseConfig.mysqlVersion}
          onChange={(e) => setDatabaseConfig({ mysqlVersion: e.target.value })}
        />
      </div>
      <div className="mt-3 flex">
        <p>Root 비밀번호</p>
        <input
          className="ml-5 h-[25px] w-[150px] rounded border px-2"
          value={databaseConfig.mysqlRootPassword}
          onChange={(e) => setDatabaseConfig({ mysqlRootPassword: e.target.value })}
        />
      </div>
      <div className="mt-3 flex">
        <p>DataBase</p>
        <input
          className="ml-5 h-[25px] w-[150px] rounded border px-2"
          value={databaseConfig.mysqlDatabase}
          onChange={(e) => setDatabaseConfig({ mysqlDatabase: e.target.value })}
        />
      </div>
      <div className="mt-3 flex">
        <p>사용자</p>
        <input
          className="ml-5 h-[25px] w-[150px] rounded border px-2"
          value={databaseConfig.mysqlUser}
          onChange={(e) => setDatabaseConfig({ mysqlUser: e.target.value })}
        />
      </div>
      <div className="mt-3 flex">
        <p>비밀번호</p>
        <input
          className="ml-5 h-[25px] w-[150px] rounded border px-2"
          value={databaseConfig.mysqlPassword}
          onChange={(e) => setDatabaseConfig({ mysqlPassword: e.target.value })}
        />
      </div>
    </div>
  );
};

export default MySqlInfo;
