import { useState } from 'react';
import { Tag } from 'emblor';
import { ChevronRight } from 'lucide-react';
import BuildScriptForm from '@/pages/newBuildPage/ui/BuildScriptForm';
import RepositoryForm from '@/pages/newBuildPage/ui/RepositoryForm';
import { useFormData } from '@/pages/newBuildPage/model/useFormData';
import { useGenerateJenkinsFile } from '../lib/useGenerateJenkinsFile';
import type { JenkinsConfig } from '@/entities/jenkinsFile/types/JenkinsConfig';

export default function JenkinsSettings() {
  const { data, setField } = useFormData();
  const [projectName, setProjectName] = useState('');
  const { generate } = useGenerateJenkinsFile();

  const request: JenkinsConfig = {
    jenkinsfileProjectType: 'JAVA_SPRING_MAVEN',
    projectName,
    gitRepositoryUrl: data.repository,
    gitCredentialsId: data.credential,
    jenkinsfileBranchConfigs: data.branches.map((b) => ({
      branchName: b.text,
      buildEnabled: true,
      testEnabled: true,
      deployEnabled: true,
    })),
    frontendDir: data.script.frontend.directory,
    backendDir: data.script.backend.directory,
    mattermostNotification: false,
    mattermostWebhookUrl: '',
    mattermostChannel: '',
    javaVersion: data.script.backend.javaVersion,
  };

  return (
    <>
      <form onSubmit={(e) => e.preventDefault()}>
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

      <button className="inline-flex cursor-pointer" onClick={() => generate(request)}>
        다음
        <ChevronRight />
      </button>
    </>
  );
}
