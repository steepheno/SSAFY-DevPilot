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
    gitUserName: '',
    gitToken: '',
    gitCredentialsId: '',
    gitPersonalToken: '',
    gitPersonalCredentialsId: '',
    gitRepoUrl: '',
    branches: '',
  });

  // 필드 상호작용 여부 추적
  const [isTry, setIsTry] = useState({
    gitUserName: false,
    gitToken: false,
    gitCredentialsId: false,
    gitPersonalToken: false,
    gitPersonalCredentialsId: false,
    gitRepoUrl: false,
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
          case 'gitUserName':
            return 'Git 아이디를 입력해주세요.';
          case 'gitToken':
            return '프로젝트의 Git 토큰값을 입력해주세요.';
          case 'gitCredentialsId':
            return '프로젝트의 Git 토큰 이름을 입력해주세요.';
          case 'gitPersonalToken':
            return '개인 Git 토큰값을 입력해주세요.';
          case 'gitPersonalCredentialsId':
            return '개인 Git 토큰 이름을 입력해주세요.';
          case 'gitRepoUrl':
            return '원격 저장소 주소를 입력해주세요.';
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
    <>
      <div>
        <FormField
          label="Git 아이디"
          required
          error={errors.gitUserName}
          showError={isTry.gitUserName && !!errors.gitUserName}
        >
          <input
            required
            className={`h-10 min-w-20 max-w-full rounded border-[1px] pl-2 ${
              isTry.gitUserName && errors.gitUserName ? 'border-red-500' : 'border-border'
            }`}
            value={repositoryConfig.gitUserName}
            onChange={(e) => handleFieldChange('gitUserName', e.target.value)}
            onBlur={(e) => handleBlur('gitUserName', e.target.value)}
          />
        </FormField>
      </div>

      <div className="flex gap-20">
        <FormField
          label="원격 저장소 주소"
          required
          error={errors.gitRepoUrl}
          showError={isTry.gitRepoUrl && !!errors.gitRepoUrl}
        >
          <input
            required
            className={`h-10 min-w-20 max-w-full rounded border-[1px] pl-2 ${
              isTry.gitRepoUrl && errors.gitRepoUrl ? 'border-red-500' : 'border-border'
            }`}
            value={repositoryConfig.gitRepoUrl}
            onChange={(e) => handleFieldChange('gitRepoUrl', e.target.value)}
            onBlur={(e) => handleBlur('gitRepoUrl', e.target.value)}
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
            required
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
                popoverContent: 'bg-white p-0',
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

      <div className="flex gap-20">
        <FormField
          label="프로젝트 Git 토큰 이름"
          required
          error={errors.gitCredentialsId}
          showError={isTry.gitCredentialsId && !!errors.gitCredentialsId}
        >
          <input
            className={`h-10 min-w-20 max-w-full rounded border-[1px] pl-2 ${
              isTry.gitCredentialsId && errors.gitCredentialsId ? 'border-red-500' : 'border-border'
            }`}
            value={repositoryConfig.gitCredentialsId}
            required
            onChange={(e) => setRepositoryConfig({ gitCredentialsId: e.target.value })}
            onBlur={(e) => handleBlur('gitCredentialsId', e.target.value)}
          />
        </FormField>

        <FormField
          label="프로젝트 Git 토큰값"
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

      <div className="flex gap-20">
        <FormField
          label="개인 Git 토큰 이름"
          required
          error={errors.gitPersonalCredentialsId}
          showError={isTry.gitPersonalCredentialsId && !!errors.gitPersonalCredentialsId}
        >
          <input
            className={`h-10 min-w-20 max-w-full rounded border-[1px] pl-2 ${
              isTry.gitPersonalCredentialsId && errors.gitPersonalCredentialsId
                ? 'border-red-500'
                : 'border-border'
            }`}
            value={repositoryConfig.gitPersonalCredentialsId}
            required
            onChange={(e) => setRepositoryConfig({ gitPersonalCredentialsId: e.target.value })}
            onBlur={(e) => handleBlur('gitPersonalCredentialsId', e.target.value)}
          />
        </FormField>

        <FormField
          label="개인 Gitlab 토큰값"
          required
          error={errors.gitPersonalToken}
          showError={isTry.gitPersonalToken && !!errors.gitPersonalToken}
        >
          <input
            className={`h-10 w-80 min-w-20 rounded border-[1px] pl-2 ${
              isTry.gitPersonalToken && errors.gitPersonalToken ? 'border-red-500' : 'border-border'
            }`}
            value={repositoryConfig.gitPersonalToken}
            required
            onChange={(e) => setRepositoryConfig({ gitPersonalToken: e.target.value })}
            onBlur={(e) => handleBlur('gitPersonalToken', e.target.value)}
          />
        </FormField>
      </div>
    </>
  );
};

export default RepositoryForm;
