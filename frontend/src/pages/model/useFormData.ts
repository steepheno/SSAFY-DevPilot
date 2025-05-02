import { useState } from 'react';
import { Tag } from 'emblor';
import { ScriptFormData } from '../ui/NewBuild/components/BuildScriptForm';

interface FormData {
  repository: string;
  branches: Tag[];
  credential: string;
  script: ScriptFormData;
}

export function useFormData(
  initial: FormData = {
    repository: '',
    branches: [],
    credential: '',
    script: { frontend: {}, backend: {} },
  },
) {
  const [data, setData] = useState(initial);

  const setField = <K extends keyof typeof initial>(key: K, value: (typeof initial)[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  return { data, setField };
}
