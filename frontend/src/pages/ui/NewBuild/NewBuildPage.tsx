import PageLayout from '@/shared/ui/PageLayout';
import BuildScriptForm from './components/BuildScriptForm';
import RepositoryForm from './components/RepositoryForm';
import { Tag } from 'emblor';
import { useFormData } from '@/pages/model/useFormData';
import { ChevronRight } from 'lucide-react';

const NewBuildPage = () => {
  const { data, setField } = useFormData();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    console.log(data);
  }

  return (
    <PageLayout>
      <form onSubmit={handleSubmit}>
        <div>
          <RepositoryForm
            repository={data.repository}
            setRepository={(value: string) => setField('repository', value)}
            branches={data.branches}
            setBranches={(tags: Tag[]) => setField('branches', tags)}
            credential={data.credential}
            setCredential={(value) => setField('credential', value)}
          />
          <BuildScriptForm
            formData={data.script}
            setFormData={(scriptObj) => setField('script', scriptObj)}
          />
        </div>

        <button className="inline-flex cursor-pointer">
          다음
          <ChevronRight />
        </button>
      </form>
    </PageLayout>
  );
};

export default NewBuildPage;
