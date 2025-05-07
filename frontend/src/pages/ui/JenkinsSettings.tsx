import { useState } from 'react';
import BuildScriptForm from './NewBuild/components/BuildScriptForm';
import RepositoryForm from './NewBuild/components/RepositoryForm';
import { Tag } from 'emblor';
import { useFormData } from '@/pages/model/useFormData';
import { ChevronRight } from 'lucide-react';
import { generateJenkinsFile } from '@/features/api/generateJenkinsfile';
import { JenkinsConfig } from '@/shared/types/JenkinsConfig.type';
import { useNavigate } from 'react-router-dom';

const JenkinsSettings = () => {
  const { data, setField } = useFormData();
  const [projectName, setProjectName] = useState('');

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
    try {
      await generateJenkinsFile(request);
      navigate('/new/environment');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <div className="flex flex-col">
          <label htmlFor="project-name">프로젝트 이름</label>
          <input
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            name="project-name"
          />
        </div>

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
      <button onClick={() => handleGenerateJenkinsFile()}>요청</button>
    </form>
  );
};

export default JenkinsSettings;
