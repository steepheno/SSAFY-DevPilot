import { useState } from 'react';
import BuildScriptForm from './NewBuild/components/BuildScriptForm';
import RepositoryForm from './NewBuild/components/RepositoryForm';
import { Tag } from 'emblor';
import { useFormData } from '@/pages/model/useFormData';
import { ChevronRight } from 'lucide-react';
import { generateJenkinsFile } from '@/features/api/generateJenkinsfile';
import { JenkinsConfig } from '@/shared/types/JenkinsConfig';
import { useNavigate } from 'react-router-dom';

const JenkinsSettings = () => {
  const { data, setField } = useFormData();
  const [projectName, setProjectName] = useState('');
  const [, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    console.log(data);
  }

  const request: JenkinsConfig = {
    jenkinsfileProjectType: 'JAVA_SPRING_MAVEN',
    projectName: projectName,
    gitRepositoryUrl: data.repository,
    gitCredentialsId: data.credential,
    jenkinsfileBranchConfigs: data.branches.map((branch) => ({
      branchName: branch.text,
      buildEnabled: true,
      testEnabled: true,
      deployEnabled: true,
    })),
    frontendDir: data.script.frontend.directory,
    backendDir: data.script.backend.directory,
    mattermostNotification: false,
    mattermostWebhookUrl: 'string',
    mattermostChannel: 'string',
    javaVersion: data.script.backend.javaVersion,
  };

  const navigate = useNavigate();
  const handleGenerateJenkinsFile = async () => {
    setLoading(true);
    setError(null);
    try {
      await generateJenkinsFile(request);
      navigate('/new/environment');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        {/* 프로젝트 이름 */}
        <div className="flex flex-col">
          <input
            required
            value={projectName}
            placeholder="프로젝트 이름"
            className="border-none bg-transparent text-2xl font-bold placeholder:text-2xl focus:outline-none"
            onChange={(e) => setProjectName(e.target.value)}
            onKeyDown={(e) =>
              ['Enter', 'Escape'].includes(e.key) ? e.currentTarget.blur() : undefined
            }
          />
        </div>

        {/* 저장소 폼 */}
        <RepositoryForm
          repository={data.repository}
          setRepository={(value: string) => setField('repository', value)}
          branches={data.branches}
          setBranches={(tags: Tag[]) => setField('branches', tags)}
          credential={data.credential}
          setCredential={(value) => setField('credential', value)}
        />

        {/* 빌드 환경 설정 폼 */}
        <BuildScriptForm
          formData={data.script}
          setFormData={(scriptObj) => setField('script', scriptObj)}
        />
      </form>

      <button className="inline-flex cursor-pointer" onClick={() => handleGenerateJenkinsFile()}>
        다음
        <ChevronRight />
      </button>
      {error && <div>{error}</div>}
    </>
  );
};

export default JenkinsSettings;
