import { useState } from 'react';
import { TagInput, Tag } from 'emblor';

export interface RepositoryFormProps {
  repository: string;
  setRepository: (value: string) => void;
  branches: Tag[];
  setBranches: (value: Tag[]) => void;
  credential: string;
  setCredential: (value: string) => void;
}

const tagChoices: Tag[] = [
  { id: 'dev', text: 'dev' },
  { id: 'develop', text: 'develop' },
  { id: 'main', text: 'main' },
  { id: 'master', text: 'master' },
];

const FormField = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-2">
    <span className="block text-sm font-medium text-gray-700">{label}</span>
    <div className="w-full">{children}</div>
  </div>
);
const RepositoryForm = ({
  repository,
  setRepository,
  branches,
  setBranches,
  credential,
  setCredential,
}: RepositoryFormProps) => {
  // 인자가 없는 경우 fallback

  const [activeTagIndex, setActiveTagIndex] = useState<number | null>(null);

  return (
    <div>
      <span className="text-xl font-bold">저장소 정보</span>
      <div className="flex gap-10">
        <FormField label="원격 저장소 주소">
          <input
            required
            className="h-10 w-80"
            value={repository}
            onChange={(e) => setRepository(e.target.value)}
          />
        </FormField>

        <FormField label="빌드 브랜치">
          <TagInput
            minTags={1}
            tags={branches}
            setTags={(newTags: any) => {
              setBranches(newTags);
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
          className="h-10 w-80"
          value={credential}
          required
          onChange={(e) => setCredential(e.target.value)}
        />
      </FormField>
    </div>
  );
};

export default RepositoryForm;
