'use client';
import backend from '../services/backend';
import { IAction, IAdminConfig, MultisignAction } from '@helpers';
import { createContext, ReactNode, useContext } from 'react';
import { useToast } from '../components/ui/use-toast';
import { useAuth } from './AuthProvider';

export type BackendContextProp = {
  submitAdminConfig: (
    config: IAdminConfig
  ) => Promise<IAdminConfig | undefined>;
  fetchAdminConfig: () => Promise<IAdminConfig>;
  addAction: (
    action: MultisignAction,
    transaction: string,
    targetAddress?: string
  ) => Promise<void>;
  getActions: () => Promise<IAction[]>;
  updateAction: (
    action: MultisignAction,
    targetAddress: string,
    signature: string
  ) => Promise<void>;
  deleteAction: (
    action: MultisignAction,
    targetAddress: string
  ) => Promise<void>;
};

const BackendContext = createContext<BackendContextProp>(
  {} as BackendContextProp
);

export const BackendProvider = ({ children }: { children: ReactNode }) => {
  const { jwt } = useAuth();
  const { toast } = useToast();

  const submitAdminConfig = async (
    config: IAdminConfig
  ): Promise<IAdminConfig | undefined> => {
    try {
      const body = {
        ...config,
        models: config.models.filter((m) => Boolean(m.name)),
        tools: config.tools.filter((t) => Boolean(t.name)),
      };

      const response = await backend.put('/admin-config', body, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });

      toast({
        title: 'Admin configuration submitted successfully',
        description: 'Your changes have been saved.',
        variant: 'default',
      });

      return response.data;
    } catch (error) {
      toast({
        title: 'Error submitting admin configuration',
        description: `${error}`,
        variant: 'destructive',
      });
    }
  };

  const fetchAdminConfig = async (): Promise<IAdminConfig> => {
    const response = await backend.get('/admin-config');

    return response.data;
  };

  const addAction = async (
    action: MultisignAction,
    transaction: string,
    targetAddress?: string
  ) => {
    const payload = {
      action,
      transaction,
      targetAddress,
    };

    await backend.post('/multisign', payload, {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });
  };

  const getActions = async (): Promise<IAction[]> => {
    const response = await backend.get('/multisign', {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });

    return response.data;
  };

  const updateAction = async (
    action: MultisignAction,
    targetAddress: string,
    signature: string
  ): Promise<void> => {
    const payload = {
      action,
      targetAddress,
      signature,
    };
    await backend.put(`/multisign`, payload, {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });
  };

  const deleteAction = async (
    action: MultisignAction,
    targetAddress: string
  ) => {
    await backend.delete(`/multisign/${action}/${targetAddress}`, {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });
  };

  const values: BackendContextProp = {
    submitAdminConfig,
    fetchAdminConfig,
    addAction,
    getActions,
    updateAction,
    deleteAction,
  };

  return (
    <BackendContext.Provider value={values}>{children}</BackendContext.Provider>
  );
};

export const useBackend = () => {
  return useContext(BackendContext);
};
