import { useBackend } from '../../src/context/BackendProvider';
import { useEffect, useState } from 'react';
import { useToast } from '../../src/components/ui/use-toast';
import { LoadingSpinner } from '../../src/components/LoadingSpinner';
import { LabeledInput } from '../../src/components/ui/labeled-input';
import { Button } from '../../src/components/ui/button';
import {
  Select,
  SelectItem,
  SelectValue,
  SelectContent,
  SelectTrigger,
} from '../../src/components/ui/select';
import { useAbiClient } from '../../src/context/AbiProvider';
import { MODULE_ADDRESS } from '../../config/env';
import { MultisignAction } from '@helpers';
import { useAuth } from '../../src/context/AuthProvider';
import { useChain } from '../../src/context/ChainProvider';

export const Actions = () => {
  const { addAction } = useBackend();
  const { walletAddress } = useAuth();
  const { abi, feesABI } = useAbiClient();
  const { toast } = useToast();
  const { aptos } = useChain();
  const [isLoading, setIsLoading] = useState(false);
  const [reviewerAddress, setReviewerAddress] = useState<`0x${string}`>();
  const [newCollector, setNewCollector] = useState<`0x${string}`>();
  const [removeCollector, setRemoveCollector] = useState<`0x${string}`>();
  const [isUpdating, setIsUpdating] = useState(false);
  const [action, setAction] = useState<string>('');

  const onAddCollector = async () => {
    try {
      setIsUpdating(true);
      const transaction = await aptos.transaction.build.multiAgent({
        sender: walletAddress,
        secondarySignerAddresses: [reviewerAddress as `0x${string}`],
        options: {
          expireTimestamp: new Date().getTime() + 24 * 60 * 60 * 1000,
        },
        data: {
          function: `${MODULE_ADDRESS}::fees_v3::add_collector`,
          functionArguments: [newCollector as `0x${string}`],
        },
      });

      await addAction(
        MultisignAction.AddCollector,
        transaction.bcsToHex().toString(),
        newCollector
      );

      toast({
        title: 'Action to add collector created successfully',
        description: `Collector ${newCollector} has been added to the reviewer's list`,
        variant: 'default',
      });

      setNewCollector('' as `0x${string}`);
    } catch (error) {
      toast({
        title: 'Error adding collector action',
        description: `Error adding collector: ${error}`,
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const onRemoveCollector = async () => {
    try {
      setIsUpdating(true);
      const transaction = await aptos.transaction.build.multiAgent({
        sender: walletAddress,
        secondarySignerAddresses: [reviewerAddress as `0x${string}`],
        options: {
          expireTimestamp: new Date().getTime() + 24 * 60 * 60 * 1000,
        },
        data: {
          function: `${MODULE_ADDRESS}::fees_v3::remove_collector`,
          functionArguments: [removeCollector as `0x${string}`],
        },
      });

      await addAction(
        MultisignAction.RemoveCollector,
        transaction.bcsToHex().toString(),
        removeCollector
      );

      toast({
        title: 'Collector added successfully',
        description: `Collector ${removeCollector} has been added to the reviewer's list`,
        variant: 'default',
      });

      setRemoveCollector('' as `0x${string}`);
    } catch (error) {
      toast({
        title: 'Error adding collector action',
        description: `Error adding collector: ${error}`,
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    void (async () => {
      setIsLoading(true);
      try {
        const reviewerResult = await abi?.useABI(feesABI).view.get_reviewer({
          typeArguments: [],
          functionArguments: [],
        });

        const reviewer = reviewerResult?.[0];

        setReviewerAddress(reviewer);
      } catch (error) {
        toast({
          title: 'Error fetching reviewer',
          description: `Not a reviewer probably set yet: ${error}`,
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    })();
  }, [abi]);

  return (
    <div className="space-x-4">
      <h2>Actions</h2>
      <Select onValueChange={setAction} value={action}>
        <SelectTrigger>
          <SelectValue placeholder="Select action" />
        </SelectTrigger>
        <SelectContent className="bg-white">
          <SelectItem value="addCollector">Add Collector</SelectItem>
          <SelectItem value="removeCollector">Remove Collector</SelectItem>
        </SelectContent>
      </Select>
      {action === 'addCollector' && (
        <>
          <div className="flex-1 mt-10">
            <LabeledInput
              id={`add-collector-input`}
              label="Collector"
              tooltip="Multising action to add collector to the reviewer's list"
              value={newCollector}
              disabled={isUpdating}
              onChange={(e) => setNewCollector(e.target.value as `0x${string}`)}
              type="text"
              required
            />
          </div>
          <div className="w-auto">
            <Button
              variant="default"
              disabled={!reviewerAddress || !newCollector}
              onClick={() => onAddCollector()}
            >
              Add Collector
            </Button>
          </div>
        </>
      )}
      {action === 'removeCollector' && (
        <>
          <div className="flex-1 mt-10">
            <LabeledInput
              id={`remove-collector-input`}
              label="Collector"
              tooltip="Multisign action to remove collector from the reviewer's list"
              value={removeCollector}
              disabled={isUpdating}
              onChange={(e) =>
                setRemoveCollector(e.target.value as `0x${string}`)
              }
              type="text"
              required
            />
          </div>
          <div className="w-auto">
            <Button
              variant="default"
              disabled={!reviewerAddress || !removeCollector}
              onClick={() => onRemoveCollector()}
            >
              Remove Collector
            </Button>
          </div>
        </>
      )}

      <LoadingSpinner on={isLoading} />
    </div>
  );
};
