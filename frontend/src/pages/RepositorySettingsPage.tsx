import { ChevronRight } from 'lucide-react';
import ProjectNameInput from './newBuildPage/ui/ProjectNameInput';
import RepositoryForm from '@/pages/newBuildPage/ui/RepositoryForm.tsx';
import { useNavigate } from 'react-router-dom';
import { useRef, useState, useEffect } from 'react';
import { useFormStore } from '@/shared/store';

export default function RepositorySettingsPage() {
  const formRef = useRef<HTMLFormElement>(null);
  const navigate = useNavigate();
  const { repositoryConfig } = useFormStore();
  const [, setShowBranchError] = useState(false);

  // 페이지 로드 시 브랜치 선택 상태 확인
  useEffect(() => {
    // 스토어에 브랜치가 선택되어 있다면 에러 메시지 숨기기
    if (
      repositoryConfig.jenkinsfileBranchConfigs &&
      repositoryConfig.jenkinsfileBranchConfigs.length > 0
    ) {
      setShowBranchError(false);
    }
  }, [repositoryConfig.jenkinsfileBranchConfigs]);

  // 새로고침 이탈 방지
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault(); // 브라우저가 기본 경고 메시지를 표시
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = formRef.current!;

    // 브랜치 선택 여부 확인 (우선 검사)
    if (
      !repositoryConfig.jenkinsfileBranchConfigs ||
      repositoryConfig.jenkinsfileBranchConfigs.length === 0
    ) {
      // 에러 상태 업데이트
      setShowBranchError(true);

      // 브랜치 필드 찾기 및 포커스
      const branchField = form.querySelector<HTMLElement>('[data-field="branches"]');
      if (branchField) {
        branchField.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // input 요소에 포커스를 주기 위한 추가 처리
        const tagInput = branchField.querySelector('input');
        if (tagInput) {
          setTimeout(() => {
            tagInput.focus();
          }, 300); // 스크롤 후 약간의 지연을 두고 포커스
        }
        return;
      }
    } else {
      // 브랜치가 선택된 경우 에러 메시지 숨기기
      setShowBranchError(false);
    }

    // 기본 HTML 유효성 검사
    const isValid = form.reportValidity();
    if (!isValid) {
      const firstInvalid = form.querySelector<HTMLElement>(':invalid');
      if (firstInvalid) {
        firstInvalid.focus();
      }
      return;
    }

    // 모든 검사 통과 시 다음 페이지로 이동
    navigate('/new/project');
  };

  return (
    <div>
      {/* 프로젝트 이름 */}
      <form ref={formRef} onSubmit={handleSubmit}>
        <ProjectNameInput />
        <div className="mb-4 mt-3 flex flex-col gap-2 rounded-[10px] bg-gray-100 px-5 py-5">
          <p className="text-xl font-bold">저장소 정보</p>
          {/* 저장소 폼 */}
          <RepositoryForm />
        </div>
        <button className="inline-flex cursor-pointer" type="submit">
          다음
          <ChevronRight />
        </button>
      </form>
    </div>
  );
}
