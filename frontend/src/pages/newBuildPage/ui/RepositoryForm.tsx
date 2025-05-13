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

const FormField = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="mt-3 space-y-2">
    <span className="block text-sm font-medium text-gray-700">{label}</span>
    <div className="w-full">{children}</div>
  </div>
);

const RepositoryForm: React.FC = () => {
  const { repositoryConfig, setRepositoryConfig } = useFormStore();

  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [activeTagIndex, setActiveTagIndex] = useState<number | null>(null);

  const onTagsChange = (newTags: Tag[]) => {
    setSelectedTags(newTags);

    // Tag[] → BranchConfig[] 로 매핑해서 store 업데이트
    const newBranchConfigs: BranchConfig[] = newTags.map((tag) => ({
      branchName: tag.id,
      buildEnabled: true,
      testEnabled: true,
      deployEnabled: true,
    }));

    setRepositoryConfig({ jenkinsfileBranchConfigs: newBranchConfigs });
  };

  return (
    <div className="mt-5">
      <span className="text-xl font-bold">저장소 정보</span>
      <div className="flex gap-10">
        <FormField label="원격 저장소 주소">
          <input
            required
            className="h-10 w-80 border-[1px] border-border"
            value={repositoryConfig.gitRepositoryUrl}
            onChange={(e) => setRepositoryConfig({ gitRepositoryUrl: e.target.value })}
          />
        </FormField>

        <FormField label="빌드 브랜치">
          <TagInput
            minTags={1}
            tags={selectedTags}
            setTags={(newTags: any) => {
              onTagsChange(newTags);
            }}
            placeholder="브랜치 추가..."
            styleClasses={{
              input: 'w-full min-w-[200px] h-10 md:max-w-[350px]',
              inlineTagsContainer: 'w-[400px] bg-white py-0 gap-2',
              tag: {
                body: 'bg-gray-100 p-1 rounded-md text-gray-600',
                closeButton: 'text-gray-400',
              },
            }}
            enableAutocomplete={true}
            autocompleteOptions={tagChoices}
            activeTagIndex={activeTagIndex}
            setActiveTagIndex={setActiveTagIndex}
          />
        </FormField>
      </div>

      <FormField label="인증 정보">
        <input
          className="h-10 w-80 border-[1px]"
          value={repositoryConfig.gitCredentialsId}
          required
          onChange={(e) => setRepositoryConfig({ gitCredentialsId: e.target.value })}
        />
      </FormField>
    </div>
  );
};

export default RepositoryForm;
