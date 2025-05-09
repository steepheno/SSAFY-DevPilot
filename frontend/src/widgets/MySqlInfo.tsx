import { useMySqlInfo } from '@/entities/dockerFile/model/useMySqlInfo';

type MySqlInfoProps = {
  mySqlInfo: ReturnType<typeof useMySqlInfo>;
};

const MySqlInfo = ({ mySqlInfo }: MySqlInfoProps) => {
  const {
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
  } = mySqlInfo;

  return (
    <div className="mb-10 rounded-[10px] bg-gray-100 px-5 py-5">
      <p className="text-xl font-bold">MySQL 설정</p>
      <div className="mt-3 flex">
        <p>버전</p>
        <input
          className="ml-5 h-[25px] w-[150px] rounded border px-2"
          value={mysqlVersion}
          onChange={(e) => setMysqlVersion(e.target.value)}
        />
      </div>
      <div className="mt-3 flex">
        <p>Root 비밀번호</p>
        <input
          className="ml-5 h-[25px] w-[150px] rounded border px-2"
          value={mysqlRootPassword}
          onChange={(e) => setMysqlRootPassword(e.target.value)}
        />
      </div>
      <div className="mt-3 flex">
        <p>DataBase</p>
        <input
          className="ml-5 h-[25px] w-[150px] rounded border px-2"
          value={mysqlDatabase}
          onChange={(e) => setMysqlDatabase(e.target.value)}
        />
      </div>
      <div className="mt-3 flex">
        <p>사용자</p>
        <input
          className="ml-5 h-[25px] w-[150px] rounded border px-2"
          value={mysqlUser}
          onChange={(e) => setMysqlUser(e.target.value)}
        />
      </div>
      <div className="mt-3 flex">
        <p>비밀번호</p>
        <input
          className="ml-5 h-[25px] w-[150px] rounded border px-2"
          value={mysqlPassword}
          onChange={(e) => setMysqlPassword(e.target.value)}
        />
      </div>
    </div>
  );
};

export default MySqlInfo;
