import { useFormStore } from '@/shared/store';
import { PencilIcon } from 'lucide-react';
import { useLayoutEffect, useRef, useState } from 'react';

const ProjectNameInput = () => {
  const { projectConfig, setProjectConfig } = useFormStore();
  const [width, setWidth] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const spanRef = useRef<HTMLSpanElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const placeholder = '프로젝트 이름';

  useLayoutEffect(() => {
    if (!spanRef.current) return;
    spanRef.current.textContent = projectConfig.projectName.length
      ? projectConfig.projectName
      : placeholder;
    setWidth(spanRef.current.offsetWidth);
  }, [projectConfig.projectName, placeholder]);

  return (
    <div className="relative flex items-center">
      <span
        ref={spanRef}
        className="invisible absolute left-0 top-0 h-10 whitespace-pre px-2 text-2xl font-semibold"
      />

      <input
        ref={inputRef}
        required
        className="h-10 border-none px-2 text-2xl font-semibold outline-none"
        maxLength={50}
        placeholder={placeholder}
        value={projectConfig.projectName}
        onChange={(e) => setProjectConfig({ projectName: e.currentTarget.value })}
        onKeyDown={(e) => ['Enter', 'Escape'].includes(e.key) && e.currentTarget.blur()}
        onFocus={() => setIsEditing(true)}
        onBlur={() => setIsEditing(false)}
        style={{ width: `${width}px` }}
      />

      {!isEditing && (
        <PencilIcon
          color="gray"
          className="ml-2 cursor-pointer"
          onClick={() => inputRef.current?.focus()}
        />
      )}
    </div>
  );
};

export default ProjectNameInput;
