import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { useBackend } from '../src/context/BackendProvider';
import { IAction } from '@helpers';
import { useEffect, useState } from 'react';
import { Button } from '../src/components/ui/button';
import {
  AccountAuthenticator,
  Deserializer,
  Hex,
  MultiAgentTransaction,
} from '@aptos-labs/ts-sdk';
import { useToast } from '../src/components/ui/use-toast';
import { useAppManagment } from '../src/context/AppManagment';

export const PendingActions = () => {
  const { signTransaction, submitTransaction } = useWallet();
  const { isReviewer, isAdmin } = useAppManagment();
  const [actions, setActions] = useState<IAction[]>([]);
  const { getActions, updateAction, deleteAction } = useBackend();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  const onSignAction = async (index: number) => {
    const action = actions[index];

    try {
      setIsUpdating(true);

      const transaction = MultiAgentTransaction.deserialize(
        new Deserializer(Hex.fromHexString(action.transaction).toUint8Array())
      );

      const signature = await signTransaction({
        transactionOrPayload: transaction,
      });

      await updateAction(
        action.action,
        action.targetAddress,
        signature.authenticator.bcsToHex().toString()
      );

      toast({
        title: 'Action signed successfully',
        description: 'Your action has been signed.',
        variant: 'default',
      });
      setActions(actions.filter((_, i) => i !== index));
    } catch (error) {
      toast({
        title: 'Error signing action',
        description: `${error}`,
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const onSubmitAction = async (index: number) => {
    const action = actions[index];

    try {
      setIsUpdating(true);

      const transaction = MultiAgentTransaction.deserialize(
        new Deserializer(Hex.fromHexString(action.transaction).toUint8Array())
      );

      const reviewerSignature = AccountAuthenticator.deserialize(
        new Deserializer(Hex.fromHexString(action.signature).toUint8Array())
      );

      const senderSignature = await signTransaction({
        transactionOrPayload: transaction,
      });

      const tx = await submitTransaction({
        transaction,
        senderAuthenticator: senderSignature.authenticator,
        additionalSignersAuthenticators: [reviewerSignature],
      });

      toast({
        title: 'Action submitted successfully',
        description: (
          <div>
            <span>
              Your action has been signed and submitted to the blockchain:
            </span>
            <a
              href={`https://explorer.aptoslabs.com/txn/${tx.hash}`}
              target="_blank"
            >
              {tx.hash}
            </a>
          </div>
        ),
        variant: 'default',
      });

      await deleteAction(action.action, action.targetAddress);

      setActions(actions.filter((_, i) => i !== index));
    } catch (error) {
      toast({
        title: 'Error submitting action',
        description: `${error}`,
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const onRemoveAction = async (index: number) => {
    const action = actions[index];

    try {
      await deleteAction(action.action, action.targetAddress);

      toast({
        title: 'Action removed successfully',
        description: `The action ${action.action} with target address ${action.targetAddress} has been removed.`,
        variant: 'default',
      });
    } catch (error) {
      toast({
        title: 'Error removing action',
        description: `${error}`,
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    void (async () => {
      const actionsResponse = await getActions();

      setActions(actionsResponse?.length ? actionsResponse : []);
    })();
  }, []);

  return (
    <div>
      <div className="flex flex-col gap-4">
        {!actions.length && <p>No pending actions found.</p>}
        {actions
          .filter((a) => !a.signature || isAdmin)
          .map((action, index) => (
            <div key={`pending-action-${index}`}>
              <div>
                {action.action} : {action.targetAddress}
              </div>
              <div>
                {isReviewer && (
                  <>
                    <Button
                      onClick={() => onSignAction(index)}
                      disabled={isUpdating}
                      variant="green"
                    >
                      Sign action
                    </Button>
                  </>
                )}
                {isAdmin && (
                  <Button
                    onClick={() => onSubmitAction(index)}
                    disabled={isUpdating}
                    variant="green"
                  >
                    Submit action
                  </Button>
                )}
                <Button onClick={() => onRemoveAction(index)}>Remove</Button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};
