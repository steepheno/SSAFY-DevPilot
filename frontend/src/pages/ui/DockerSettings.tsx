// import DockerfileConfig from '@/shared/types/DockerfileConfig.type';

const DockerfileSettings = () => {
  return (
    <div className="bg-gray-200 px-10 py-10">
      {/* 프로젝트 이름 입력 */}
      <div className="mb-10">
        <p className="text-xl font-bold">프로젝트 이름</p>
        <input className="mt-3 h-[30px] rounded border px-2"></input>
      </div>

      {/* 빌드 정보 입력 */}
      <div className="mb-10">
        <p className="text-xl font-bold">빌드 정보</p>
        <p className="mt-5 font-bold">백엔드</p>
        <div className="mt-2 flex justify-between">
          <div className="flex">
            <p>폴더명</p>
            <input className="ml-5 h-[25px] rounded border px-2"></input>
          </div>
          <div className="flex">
            <p>포트번호</p>
            <input className="ml-5 h-[25px] rounded border px-2"></input>
          </div>
          <div className="flex">
            <p>Java 버전</p>
            <select className="ml-5 h-[25px] rounded border px-2">
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
            <input className="ml-5 h-[25px] rounded border px-2"></input>
          </div>
          <div className="flex">
            <p>포트번호</p>
            <input className="ml-5 h-[25px] rounded border px-2"></input>
          </div>
          <div className="flex">
            <p>Docker 환경</p>
            <input className="ml-5 h-[25px] rounded border px-2"></input>
          </div>
        </div>
      </div>

      {/* 프로젝트 환경 선택 */}
      <div className="mb-10">
        <p className="text-xl font-bold">프로젝트 환경 선택</p>
        <div className="mt-3 flex flex-col space-y-2">
          <div className="flex items-center space-x-2">
            <input className="cursor-pointer" type="checkbox" id="gradle" />
            <label className="cursor-pointer" htmlFor="gradle">
              Gradle
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <input className="cursor-pointer" type="checkbox" id="maven" />
            <label className="cursor-pointer" htmlFor="maven">
              Maven
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <input className="cursor-pointer" type="checkbox" id="nginx" />
            <label className="cursor-pointer" htmlFor="nginx">
              Nginx
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <input className="cursor-pointer" type="checkbox" id="redis" />
            <label className="cursor-pointer" htmlFor="redis">
              Redis
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <input className="cursor-pointer" type="checkbox" id="mysql" />
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
          <input className="ml-5 h-[25px] w-[150px] rounded border px-2"></input>
        </div>
        <div className="mt-3 flex">
          <p>Root 비밀번호</p>
          <input className="ml-5 h-[25px] w-[150px] rounded border px-2"></input>
        </div>
        <div className="mt-3 flex">
          <p>DataBase</p>
          <input className="ml-5 h-[25px] w-[150px] rounded border px-2"></input>
        </div>
        <div className="mt-3 flex">
          <p>사용자</p>
          <input className="ml-5 h-[25px] w-[150px] rounded border px-2"></input>
        </div>
        <div className="mt-3 flex">
          <p>비밀번호</p>
          <input className="ml-5 h-[25px] w-[150px] rounded border px-2"></input>
        </div>
      </div>

      {/* 빌드 버튼 */}
      <div className="flex justify-center">
        <button className="rounded-[10px] bg-blue-500 px-4 py-2 text-white">빌드하기</button>
      </div>
    </div>
  );
};

export default DockerfileSettings;
