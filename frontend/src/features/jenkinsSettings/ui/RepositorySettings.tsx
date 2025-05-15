import { useFormStore } from '@/shared/store';
import { ChevronRight } from 'lucide-react';
import RepositoryForm from '@/pages/newBuildPage/ui/RepositoryForm';
import { useNavigate } from 'react-router-dom';

export default function RepositorySettings() {
  const { projectConfig, setProjectConfig } = useFormStore();

  const navigate = useNavigate();

  return (
    <>
      <h2>저장소 설정</h2>
      <form onSubmit={(e) => e.preventDefault()} className="mt-5">
        <div className="mb-4 flex flex-col gap-2 rounded-[10px] bg-gray-100 px-5 py-5">
          {/* 프로젝트 이름 */}
          <div>
            <p className="text-body font-bold">프로젝트 이름</p>
            <input
              className="mt-3 h-8 rounded border px-2"
              value={projectConfig.projectName}
              onChange={(e) => setProjectConfig({ projectName: e.target.value })}
              onKeyDown={(e) =>
                ['Enter', 'Escape'].includes(e.key) ? e.currentTarget.blur() : undefined
              }
            />
          </div>

          {/* 저장소 폼 */}
          <RepositoryForm />
        </div>
      </form>

      <button
        className="inline-flex cursor-pointer"
        onClick={() => {
          // 프로젝트 제목 검증
          if (!projectConfig.projectName) {
            alert('프로젝트 이름을 입력해주세요.');
            return;
          }
          navigate('/new/project');
        }}
      >
        다음
        <ChevronRight />
      </button>
    </>
  );
}
