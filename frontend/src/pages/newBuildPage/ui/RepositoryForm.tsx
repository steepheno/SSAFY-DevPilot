import { useState } from 'react';
import { useFormStore } from '@/shared/store';
import { TagInput, Tag } from 'emblor';
import { BranchConfig } from '@/entities/repository/types';

const tagChoices: Tag[] = [
  { id: 'dev', text: 'dev' },
  { id: 'develop', text: 'develop' },
  { id: 'main', text: 'main' },
  { id: 'master', text: 'master' },
];

const FormField = ({
  label,
  children,
  required = false,
  error = '',
  showError = false,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  error?: string;
  showError?: boolean;
}) => (
  <div className="mt-3 space-y-2">
    <span className="text-m block font-medium text-gray-700">
      {required && <span className="mr-1 text-red-500">*</span>}
      {label}
    </span>
    <div className="w-full">{children}</div>
    {showError && error && <div className="text-xs text-red-500">{error}</div>}
  </div>
);

const RepositoryForm = () => {
  const { repositoryConfig, setRepositoryConfig } = useFormStore();

  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [activeTagIndex, setActiveTagIndex] = useState<number | null>(null);

  // 각 필드별 에러 상태
  const [errors, setErrors] = useState({
    gitRepositoryUrl: '',
    gitCredentialsId: '',
    gitToken: '',
    branches: '',
  });

  // 필드 상호작용 여부 추적
  const [isTry, setIsTry] = useState({
    gitRepositoryUrl: false,
    gitCredentialsId: false,
    gitToken: false,
    branches: false,
  });

  // 유효성 검사
  const validateField = (name: string, value: string | Tag[]): string => {
    if (name === 'branches') {
      const tags = value as Tag[];
      if (!tags || tags.length === 0) {
        return '빌드 브랜치를 하나 이상 선택해주세요.';
      }
    } else {
      // 문자열 필드에 대한 유효성 검사
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        switch (name) {
          case 'gitRepositoryUrl':
            return '원격 저장소 주소를 입력해주세요.';
          case 'gitCredentialsId':
            return '인증 정보를 입력해주세요.';
          case 'gitToken':
            return 'Gitlab 토큰을 입력해주세요.';
          default:
            return '필수 입력 항목입니다.';
        }
      }
    }
    return '';
  };

  // 필드 상태 변경 처리
  const handleFieldChange = (name: string, value: string) => {
    // 저장소 설정 업데이트
    setRepositoryConfig({ [name]: value });

    // 필드 상호작용 표시
    setIsTry((prev) => ({ ...prev, [name]: true }));

    // 유효성 검사 실행
    if (isTry[name as keyof typeof isTry]) {
      setErrors((prev) => ({
        ...prev,
        [name]: validateField(name, value),
      }));
    }
  };

  // 포커스 벗어났을 때 유효성 검사
  const handleBlur = (name: string, value: string | Tag[]) => {
    setIsTry((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name, value),
    }));
  };

  const onTagsChange = (newTags: Tag[]) => {
    setSelectedTags(newTags);
    // Tag[] -> BranchConfig[]로 매핑 후 store 업데이트
    const newBranchConfigs: BranchConfig[] = newTags.map((tag) => ({
      branchName: tag.id,
      buildEnabled: true,
      testEnabled: true,
      deployEnabled: true,
    }));

    setRepositoryConfig({ jenkinsfileBranchConfigs: newBranchConfigs });

    // 브랜치 필드 유효성 검사
    if (isTry.branches) {
      setErrors((prev) => ({
        ...prev,
        branches: validateField('branches', newTags),
      }));
    }
  };

  return (
    <div className="mt-5">
      <span className="text-xl font-bold">저장소 정보</span>
      <div className="flex gap-10">
        <FormField
          label="원격 저장소 주소"
          required
          error={errors.gitRepositoryUrl}
          showError={isTry.gitRepositoryUrl && !!errors.gitRepositoryUrl}
        >
          <input
            required
            className={`h-10 min-w-20 max-w-full rounded border-[1px] pl-2 ${
              isTry.gitRepositoryUrl && errors.gitRepositoryUrl ? 'border-red-500' : 'border-border'
            }`}
            value={repositoryConfig.gitRepositoryUrl}
            onChange={(e) => handleFieldChange('gitRepositoryUrl', e.target.value)}
            onBlur={(e) => handleBlur('gitRepositoryUrl', e.target.value)}
          />
        </FormField>

        <FormField
          label="빌드 브랜치"
          required
          error={errors.branches}
          showError={isTry.branches && !!errors.branches}
        >
          <TagInput
            minTags={1}
            tags={selectedTags}
            setTags={(newTags: any) => {
              onTagsChange(newTags);
            }}
            styleClasses={{
              tagList: {
                container: 'p-0',
              },
              input: `max-w-80 p-0 min-w-20 h-10 md:max-w-[350px] ${
                isTry.branches && errors.branches ? 'border-red-500' : ''
              }`,
              inlineTagsContainer: `min-w-20 bg-white p-0 gap-2 ${
                isTry.branches && errors.branches ? 'border-red-500' : ''
              }`,
              autoComplete: {
                popoverContent: 'bg-white',
              },
              tag: {
                body: 'bg-gray-100 p-1 ml-2 rounded-md text-gray-600',
                closeButton: 'text-gray-400',
              },
            }}
            enableAutocomplete={true}
            autocompleteOptions={tagChoices}
            activeTagIndex={activeTagIndex}
            setActiveTagIndex={setActiveTagIndex}
            onBlur={() => handleBlur('branches', selectedTags)}
          />
        </FormField>
      </div>

      <div className="flex gap-10">
        <FormField
          label="인증 정보"
          required
          error={errors.gitCredentialsId}
          showError={isTry.gitCredentialsId && !!errors.gitCredentialsId}
        >
          <input
            className={`h-10 min-w-20 max-w-80 rounded border-[1px] pl-2 ${
              isTry.gitCredentialsId && errors.gitCredentialsId ? 'border-red-500' : 'border-border'
            }`}
            value={repositoryConfig.gitCredentialsId}
            required
            onChange={(e) => setRepositoryConfig({ gitCredentialsId: e.target.value })}
            onBlur={(e) => handleBlur('gitCredentialsId', e.target.value)}
          />
        </FormField>

        <FormField
          label="Gitlab 토큰"
          required
          error={errors.gitToken}
          showError={isTry.gitToken && !!errors.gitToken}
        >
          <input
            className={`h-10 w-80 min-w-20 rounded border-[1px] pl-2 ${
              isTry.gitToken && errors.gitToken ? 'border-red-500' : 'border-border'
            }`}
            value={repositoryConfig.gitToken}
            required
            onChange={(e) => setRepositoryConfig({ gitToken: e.target.value })}
            onBlur={(e) => handleBlur('gitToken', e.target.value)}
          />
        </FormField>
      </div>
    </div>
  );
};

export default RepositoryForm;
