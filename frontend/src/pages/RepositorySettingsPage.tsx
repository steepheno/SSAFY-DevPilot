import { ChevronRight } from 'lucide-react';
import ProjectNameInput from './newBuildPage/ui/ProjectNameInput';
import RepositoryForm from '@/pages/newBuildPage/ui/RepositoryForm.tsx';
import { useNavigate } from 'react-router-dom';
import { useRef } from 'react';

export default function RepositorySettingsPage() {
  const formRef = useRef<HTMLFormElement>(null);

  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = formRef.current!;
    const isValid = form.reportValidity();

    // form validation
    if (!isValid) {
      const firstInvalid = form.querySelector<HTMLElement>(':invalid');
      firstInvalid?.focus();
      return;
    }
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
        <button className="inline-flex cursor-pointer">
          다음
          <ChevronRight />
        </button>
      </form>
    </div>
  );
}
