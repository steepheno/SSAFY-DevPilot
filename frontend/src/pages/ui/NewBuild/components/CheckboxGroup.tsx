import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";

// 체크박스 옵션 타입 정의
export interface CheckboxOption {
  id: string;
  label: string;
}

interface CheckboxGroupProps {
  options: CheckboxOption[];
  onChange?: (selected: Record<string, boolean>) => void;
}

const CheckboxGroup = ({ options, onChange }: CheckboxGroupProps) => {
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const checkboxChange = (id: string) => {
    const newSelected = {
      ...selected,
      [id]: !selected[id]
    };
    
    setSelected(newSelected);
    
    // 부모 컴포넌트에 선택 상태 전달
    if (onChange) {
      onChange(newSelected);
    }
  };

  return (
    <div className="flex flex-wrap gap-4 mt-3">
      {options.map((option) => (
        <div key={option.id} className="items-top flex space-x-2">
          <Checkbox 
            id={option.id} 
            checked={selected[option.id] || false}
            onCheckedChange={() => checkboxChange(option.id)}
          />
          <div className="grid gap-1.5 leading-none">
            <label
              htmlFor={option.id}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              {option.label}
            </label>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CheckboxGroup;