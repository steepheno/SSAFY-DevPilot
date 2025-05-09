import { useState } from 'react';
import { Tag } from 'emblor';
import { BuildScriptFormData } from '../ui/BuildScriptForm';

interface FormData {
  repository: string;
  branches: Tag[];
  credential: string;
  script: BuildScriptFormData;
}

export function useFormData(
  initial: FormData = {
    repository: '',
    branches: [],
    credential: '',
    script: {
      frontend: { directory: '', portNo: '', selected: {} },
      backend: { directory: '', portNo: '', selected: {}, javaVersion: '' },
      projectEnvironments: {
        gradle: false,
        maven: false,
        nginx: false,
        redis: false,
        mysql: false,
      },
    },
  },
) {
  const [data, setData] = useState(initial);

  const setField = <K extends keyof FormData>(key: K, value: (typeof initial)[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  return { data, setField };
}
