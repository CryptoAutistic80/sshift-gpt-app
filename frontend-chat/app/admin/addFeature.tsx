import { FeatureType } from '@helpers';
import { Button } from '../../src/components/ui/button';
import { LabeledInput } from '../../src/components/ui/labeled-input';

interface AddFeaturesProps {
  isUpdating: boolean;
  index: number;
  featureType: FeatureType;
  name?: string;
  credits?: number;
  onChangeName: (index: number, value: string) => void;
  onChangeCredits: (index: number, value: number) => void;
  onAdd: () => void;
  onRemove: () => void;
}

export const AddFeature = (props: AddFeaturesProps) => {
  const {
    isUpdating,
    index,
    name,
    featureType,
    credits,
    onChangeName,
    onChangeCredits,
    onAdd,
    onRemove,
  } = props;

  return (
    <div className="grid grid-cols-[1fr,1fr,auto,auto] gap-4 items-center">
      <div>
        <LabeledInput
          id={`feature-${featureType}-${index}`}
          label=""
          tooltip="Model or tool name to be added"
          required={index === 0}
          value={name}
          onChange={(e) => onChangeName(index, e.target.value)}
          disabled={isUpdating}
          type="text"
        />
      </div>
      <div>
        <LabeledInput
          id={`feature-credits-${featureType}-${index}`}
          label=""
          tooltip="Credits cost per use"
          required={index === 0}
          value={credits}
          disabled={isUpdating}
          onChange={(e) => onChangeCredits(index, parseInt(e.target.value))}
          type="number"
        />
      </div>
      <Button 
        variant="outline" 
        size="sm"
        onClick={onAdd}
        className="whitespace-nowrap"
      >
        Add New
      </Button>
      {index !== 0 && (
        <Button 
          variant="destructive" 
          size="sm"
          onClick={onRemove}
          className="whitespace-nowrap"
        >
          Remove
        </Button>
      )}
      {index === 0 && <div />}
    </div>
  );
};
