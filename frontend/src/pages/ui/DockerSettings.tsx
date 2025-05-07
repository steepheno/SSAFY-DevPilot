import { generateDockerfile } from '@/pages/api';
import { DockerSuccessResponse } from '@/pages/api';
import DockerfileConfig from '@/shared/types/DockerfileConfig';
import { useState } from 'react';

const DockerfileSettings = () => {
  // 입력 필드 상태 관리
  const [projectName, setProjectName] = useState('');
  const [backendDir, setBackendDir] = useState('');
  const [backendPort, setBackendPort] = useState(0);
  const [frontendDir, setFrontendDir] = useState('');
  const [javaVersion, setJavaVersion] = useState('');
  const [frontendPort, setFrontendPort] = useState(0);
  const [dockerfileFrontendType, setDockerfileFrontendType] = useState('');

  // 프로젝트 환경 체크박스 상태 관리
  const [useGradle, setUseGradle] = useState(false);
  const [useMaven, setUseMaven] = useState(false);
  const [useNginx, setUseNginx] = useState(false);
  const [useRedis, setUseRedis] = useState(false);
  const [useMysql, setUseMysql] = useState(false);

  // MySQL 설정 상태 관리
  const [mysqlVersion, setMysqlVersion] = useState('');
  const [mysqlRootPassword, setMysqlRootPassword] = useState('');
  const [mysqlDatabase, setMysqlDatabase] = useState('');
  const [mysqlUser, setMysqlUser] = useState('');
  const [mysqlPassword, setMysqlPassword] = useState('');

  // 로딩 상태 관리
  const [isLoading, setIsLoading] = useState(false);

  // 응답 결과 상태 관리
  const [result, setResult] = useState<DockerSuccessResponse | null>(null);

  const buildDockerfile = async () => {
    // 입력값 검증
    if (!projectName) {
      alert('프로젝트 이름을 입력해주세요.');
      return;
    }

    if (!backendDir) {
      alert('백엔드 폴더명을 입력해주세요.');
      return;
    }

    if (!frontendDir) {
      alert('프론트엔드 폴더명을 입력해주세요.');
      return;
    }

    if (
      useMysql &&
      (!mysqlVersion || !mysqlRootPassword || !mysqlDatabase || !mysqlUser || !mysqlPassword)
    ) {
      alert('MySQL 설정 정보를 모두 입력해주세요.');
      return;
    }

    // API 요청 데이터 구성
    const dockerConfig: DockerfileConfig = {
      projectName,
      backendDir,
      frontendDir,
      useMaven,
      javaVersion,
      backendPort: Number(backendPort),
      dockerfileFrontendType,
      frontendPort: Number(frontendPort),
      useNginx,
      useRedis,
      useMySQL: useMysql,
      mysqlVersion,
      mysqlRootPassword,
      mysqlDatabase,
      mysqlUser,
      mysqlPassword,
    };

    try {
      setIsLoading(true);

      // API 함수 호출
      const data = await generateDockerfile(dockerConfig);
      console.log(data);
      console.log(result); // 응답 결과 확인 (미사용 에러 제거용)

      // 응답 결과 설정
      setResult(data);

      alert('Dockerfile이 성공적으로 생성되었습니다.');
    } catch (error) {
      alert('Dockerfile 생성 중 오류 발생');
      console.error('오류 메시지: ', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-200 px-10 py-10">
      {/* 프로젝트 이름 입력 */}
      <div className="mb-10">
        <p className="text-xl font-bold">프로젝트 이름</p>
        <input
          className="mt-3 h-[30px] rounded border px-2"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
        />
      </div>

      {/* 빌드 정보 입력 */}
      <div className="mb-10">
        <p className="text-xl font-bold">빌드 정보</p>
        <p className="mt-5 font-bold">백엔드</p>
        <div className="mt-2 flex justify-between">
          <div className="flex">
            <p>폴더명</p>
            <input
              className="ml-5 h-[25px] rounded border px-2"
              value={backendDir}
              onChange={(e) => setBackendDir(e.target.value)}
            />
          </div>
          <div className="flex">
            <p>포트번호</p>
            <input
              className="ml-5 h-[25px] rounded border px-2"
              type="number"
              value={backendPort}
              onChange={(e) => setBackendPort(Number(e.target.value))}
            />
          </div>
          <div className="flex">
            <p>Java 버전</p>
            <select
              className="ml-5 h-[25px] rounded border px-2"
              value={javaVersion}
              onChange={(e) => setJavaVersion(e.target.value)}
            >
              <option value="option">선택하세요</option>
              <option value="8">JDK 8</option>
              <option value="11">JDK 11</option>
              <option value="17">JDK 17</option>
              <option value="21">JDK 21</option>
            </select>
          </div>
        </div>
        <p className="mt-10 font-bold">프론트엔드</p>
        <div className="mt-2 flex justify-between">
          <div className="flex">
            <p>폴더명</p>
            <input
              className="ml-5 h-[25px] rounded border px-2"
              value={frontendDir}
              onChange={(e) => setFrontendDir(e.target.value)}
            />
          </div>
          <div className="flex">
            <p>포트번호</p>
            <input
              className="ml-5 h-[25px] rounded border px-2"
              type="number"
              value={frontendPort}
              onChange={(e) => setFrontendPort(Number(e.target.value))}
            />
          </div>
          <div className="flex">
            <p>Docker 환경</p>
            <select
              className="ml-5 h-[25px] rounded border px-2"
              value={dockerfileFrontendType}
              onChange={(e) => setDockerfileFrontendType(e.target.value)}
            >
              <option value="option">선택하세요</option>
              <option value="REACT">REACT</option>
              <option value="VUE">VUE</option>
              <option value="NEXTJS">NEXTJS</option>
            </select>
          </div>
        </div>
      </div>

      {/* 프로젝트 환경 선택 */}
      <div className="mb-10">
        <p className="text-xl font-bold">프로젝트 환경 선택</p>
        <div className="mt-3 flex flex-col space-y-2">
          <div className="flex items-center space-x-2">
            <input
              className="cursor-pointer"
              type="checkbox"
              id="gradle"
              checked={useGradle}
              onChange={() => setUseGradle(!useGradle)}
            />
            <label className="cursor-pointer" htmlFor="gradle">
              Gradle
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              className="cursor-pointer"
              type="checkbox"
              id="maven"
              checked={useMaven}
              onChange={() => setUseMaven(!useMaven)}
            />
            <label className="cursor-pointer" htmlFor="maven">
              Maven
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              className="cursor-pointer"
              type="checkbox"
              id="nginx"
              checked={useNginx}
              onChange={() => setUseNginx(!useNginx)}
            />
            <label className="cursor-pointer" htmlFor="nginx">
              Nginx
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              className="cursor-pointer"
              type="checkbox"
              id="redis"
              checked={useRedis}
              onChange={() => setUseRedis(!useRedis)}
            />
            <label className="cursor-pointer" htmlFor="redis">
              Redis
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              className="cursor-pointer"
              type="checkbox"
              id="mysql"
              checked={useMysql}
              onChange={() => setUseMysql(!useMysql)}
            />
            <label className="cursor-pointer" htmlFor="mysql">
              MySQL
            </label>
          </div>
        </div>
      </div>

      {/* MySQL 설정 */}
      <div className="mb-10">
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

      {/* 빌드 버튼 */}
      <div className="flex justify-center">
        <button
          className="rounded-[10px] bg-blue-500 px-4 py-2 text-white"
          onClick={buildDockerfile}
          disabled={isLoading}
        >
          {isLoading ? '빌드 중...' : '빌드하기'}
        </button>
      </div>
    </div>
  );
};

export default DockerfileSettings;
