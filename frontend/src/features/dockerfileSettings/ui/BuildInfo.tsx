import { useFormStore } from '@/shared/store';

const BuildInfo = () => {
  const { backendConfig, setBackendConfig, frontendConfig, setFrontendConfig } = useFormStore();

  return (
    <div className="mb-10 rounded-[10px] bg-gray-100 px-5 py-5">
      <p className="text-xl font-bold">빌드 정보</p>
      <p className="mt-5 font-bold">백엔드</p>
      <div className="mt-2 flex justify-between">
        <div className="flex">
          <p>폴더명</p>
          <input
            className="ml-5 h-[25px] rounded border px-2"
            value={backendConfig.backendDir}
            onChange={(e) => setBackendConfig({ backendDir: e.target.value })}
          />
        </div>
        <div className="flex">
          <p>포트번호</p>
          <input
            className="ml-5 h-[25px] rounded border px-2"
            type="number"
            value={backendConfig.backendPort}
            onChange={(e) => setBackendConfig({ backendPort: Number(e.target.value) })}
          />
        </div>
        <div className="flex">
          <p>Java 버전</p>
          <select
            className="ml-5 h-[25px] rounded border px-2"
            value={backendConfig.javaVersion}
            onChange={(e) => setBackendConfig({ javaVersion: e.target.value })}
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
            value={frontendConfig.frontendDir}
            onChange={(e) => setFrontendConfig({ frontendDir: e.target.value })}
          />
        </div>
        <div className="flex">
          <p>포트번호</p>
          <input
            className="ml-5 h-[25px] rounded border px-2"
            type="number"
            value={frontendConfig.frontendPort}
            onChange={(e) => setFrontendConfig({ frontendPort: Number(e.target.value) })}
          />
        </div>
        <div className="flex">
          <p>프로젝트 환경</p>
          <select
            className="ml-5 h-[25px] rounded border px-2"
            value={frontendConfig.dockerfileFrontendType}
            onChange={(e) => setFrontendConfig({ dockerfileFrontendType: e.target.value })}
          >
            <option value="option">선택하세요</option>
            <option value="REACT">REACT</option>
            <option value="VUE">VUE</option>
            <option value="NEXTJS">NEXTJS</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default BuildInfo;
