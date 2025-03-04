import { useBackend } from '../../src/context/BackendProvider';
import { useEffect, useState } from 'react';
import { FeatureType, IAdminConfig } from '@helpers';
import { useToast } from '../../src/components/ui/use-toast';
import { AddFeature } from './addFeature';
import { LoadingSpinner } from '../../src/components/LoadingSpinner';
import { ConfirmButton } from '../../src/components/ui/confirm-button';

export const Features = () => {
  const { submitAdminConfig, fetchAdminConfig } = useBackend();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [adminConfig, setAdminConfig] = useState<IAdminConfig>({
    models: [],
    tools: [],
  });

  const disabledConfirmButton =
    adminConfig.models.some((m) => m.name === '' || m.credits === 0) &&
    adminConfig.tools.some((t) => t.name === '' || t.credits === 0);

  const onAddModel = () => {
    setAdminConfig({
      ...adminConfig,
      models: [...adminConfig.models, { name: '', credits: 0 }],
    });
  };

  const onRemoveModel = (index: number) => {
    setAdminConfig({
      ...adminConfig,
      models: adminConfig.models.filter((_, i) => i !== index),
    });
  };

  const onAddTool = () => {
    setAdminConfig({
      ...adminConfig,
      tools: [...adminConfig.tools, { name: '', credits: 0 }],
    });
  };

  const onRemoveTool = (index: number) => {
    setAdminConfig({
      ...adminConfig,
      tools: adminConfig.tools.filter((_, i) => i !== index),
    });
  };

  const onChangeModelName = (index: number, name: string) => {
    setAdminConfig({
      ...adminConfig,
      models: [
        ...adminConfig.models.map((m, i) => {
          const value = { ...m };
          if (i === index) {
            value.name = name;
          }
          return value;
        }),
      ],
    });
  };

  const onChangeModelCredits = (index: number, credits: number) => {
    setAdminConfig({
      ...adminConfig,
      models: [
        ...adminConfig.models.map((m, i) => {
          const value = { ...m };
          if (i === index) {
            value.credits = credits;
          }
          return value;
        }),
      ],
    });
  };

  const onChangeToolName = (index: number, name: string) => {
    setAdminConfig({
      ...adminConfig,
      tools: [
        ...adminConfig.tools.map((t, i) => {
          if (i === index) {
            return { ...t, name };
          }
          return t;
        }),
      ],
    });
  };

  const onChangeToolCredits = (index: number, credits: number) => {
    setAdminConfig({
      ...adminConfig,
      tools: [
        ...adminConfig.tools.map((t, i) => {
          if (i === index) {
            return { ...t, credits };
          }
          return t;
        }),
      ],
    });
  };

  useEffect(() => {
    void (async () => {
      setIsLoading(true);
      try {
        const config = await fetchAdminConfig();
        if (config) {
          setAdminConfig({
            ...config,
            models: config.models.length
              ? config.models
              : [
                  {
                    name: '',
                    credits: 0,
                  },
                ],
            tools: config.tools.length
              ? config.tools
              : [
                  {
                    name: '',
                    credits: 0,
                  },
                ],
          });
        }
      } catch (error) {
        toast({
          title: 'Error fetching admin configuration',
          description: `${error}`,
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Models Configuration</h2>
        <div className="grid grid-cols-[1fr,1fr,auto] gap-4 items-center">
          <div className="font-medium text-sm text-gray-700">Model Name</div>
          <div className="font-medium text-sm text-gray-700">Credits Cost</div>
          <div></div>
        </div>
        {adminConfig.models.map((model, index) => (
          <AddFeature
            featureType={FeatureType.Models}
            index={index}
            name={model.name}
            credits={model.credits}
            isUpdating={isLoading}
            key={`model-${index}`}
            onAdd={onAddModel}
            onRemove={() => onRemoveModel(index)}
            onChangeCredits={onChangeModelCredits}
            onChangeName={onChangeModelName}
          />
        ))}
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Tools Configuration</h2>
        <div className="grid grid-cols-[1fr,1fr,auto,auto] gap-4 items-center">
          <div className="font-medium text-sm text-gray-700">Tool Name</div>
          <div className="font-medium text-sm text-gray-700">Credits Cost</div>
          <div></div>
          <div></div>
        </div>
        {adminConfig.tools.map((tool, index) => (
          <AddFeature
            featureType={FeatureType.Tools}
            index={index}
            name={tool.name}
            credits={tool.credits}
            isUpdating={isLoading}
            key={`tool-${index}`}
            onAdd={onAddTool}
            onRemove={() => onRemoveTool(index)}
            onChangeCredits={onChangeToolCredits}
            onChangeName={onChangeToolName}
          />
        ))}
      </div>

      <div className="pt-4">
        <ConfirmButton
          variant="green"
          title="Save Config"
          onSubmit={() => submitAdminConfig(adminConfig)}
          disabled={disabledConfirmButton}
          confirmMessage={
            <p>
              This action will create, update or delete models or tools in the
              admin configuration. Do you agree?
            </p>
          }
        />
      </div>

      <LoadingSpinner on={isLoading} />
    </div>
  );
};
