import { Input } from './input';
import { Label } from './label';
import { FC } from 'react';

export const LabeledInput: FC<{
  label: string;
  required?: boolean;
  tooltip?: string;
  disabled?: boolean;
  value?: number | string;
  type?: 'number' | 'text';
  id: string;
  readOnly?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({
  label,
  required,
  tooltip,
  disabled,
  value,
  onChange,
  id,
  type = 'number',
  readOnly,
}) => {
  return (
    <div className="flex flex-col item-center space-y-2">
      {label && (
        <Label htmlFor={id}>
          {label} {required ? '' : '(optional)'}
        </Label>
      )}
      <Input
        disabled={disabled}
        type={type}
        id={id}
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        placeholder={tooltip}
      />
    </div>
  );
};
