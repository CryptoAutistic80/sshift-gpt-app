'use client';
import { useAbiClient } from '../../src/context/AbiProvider';
import { useEffect, useState } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import {
  convertAmountFromHumanReadableToOnChain,
  convertAmountFromOnChainToHumanReadable,
} from '@aptos-labs/ts-sdk';
import { useWalletClient } from '@thalalabs/surf/hooks';
import { toast } from '../../src/components/ui/use-toast';
import { LabeledInput } from '../../src/components/ui/labeled-input';
import { Button } from '../../src/components/ui/button';
import { RESOURCE_ACCOUNT_SEED } from '../../config/env';
import { useAppManagment } from '../../src/context/AppManagment';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../src/components/ui/select';
import { Label } from '../../src/components/ui/label';
import { X } from 'lucide-react';

// Interface for currency
interface Currency {
  address: `0x${string}`;
  name: string;
  symbol: string;
  isStableCoin: boolean;
}

export const EnhancedFees = ({ isReviewerMode = false }: { isReviewerMode?: boolean }) => {
  const { abi, feesABI } = useAbiClient();
  const [isCurrencySet, setIsCurrencySet] = useState(false);
  const [newAddress, setNewAddress] = useState<`0x${string}`>();
  const [isResourceAccountSet, setIsResourceAccountSet] = useState<boolean>(false);
  const [collectorsSubscribed, setCollectorsSubscribed] = useState<`0x${string}`[]>([]);
  const [collectorsNotSubscribed, setCollectorsNotSubscribed] = useState<`0x${string}`[]>([]);
  const [initialCollectors, setInitialCollectors] = useState<`0x${string}`[]>([]);
  const [fees, setFees] = useState<number[]>([]);
  const [resourceAccountBalance, setResourceAccountBalance] = useState<number>(0);
  const { connected } = useWallet();
  const { client } = useWalletClient();
  const { resourceAccount, setResourceAccount, currency, setCurrency } = useAppManagment();
  
  // New state for enhanced currency management
  const [currencies, setCurrencies] = useState<Currency[]>([
    // Updated to use USDC and USDT as the default currencies
    { address: '0x1::usdc::USDC' as `0x${string}`, name: 'USD Coin', symbol: 'USDC', isStableCoin: true },
    { address: '0x1::usdt::USDT' as `0x${string}`, name: 'Tether USD', symbol: 'USDT', isStableCoin: true },
  ]);
  const [newCurrency, setNewCurrency] = useState<Currency>({
    address: '' as `0x${string}`,
    name: '',
    symbol: '',
    isStableCoin: false
  });
  const [selectedPaymentCurrency, setSelectedPaymentCurrency] = useState<`0x${string}`>(
    '0x1::usdc::USDC' as `0x${string}`
  );

  // Reuse existing useEffects and functions from the original Fees component
  useEffect(() => {
    if (isResourceAccountSet) {
      void (async () => {
        const balance = await abi?.useABI(feesABI).view.get_resource_balance({
          typeArguments: [],
          functionArguments: [],
        });

        setResourceAccountBalance(
          convertAmountFromOnChainToHumanReadable(Number(balance?.[0]), 8)
        );
      })();
    }
    void (async () => {
      let currencyCopy;
      const resourceAccountExists = await abi
        ?.useABI(feesABI)
        .view.resource_account_exists({
          typeArguments: [],
          functionArguments: [],
        });

      const isResourceAccountExists = Boolean(resourceAccountExists?.[0]);

      if (isResourceAccountExists) {
        const currencyResult = await abi
          ?.useABI(feesABI)
          .view.get_currency_addr({
            typeArguments: [],
            functionArguments: [],
          });

        currencyCopy = currencyResult?.[0];
      }

      setIsResourceAccountSet(isResourceAccountExists);
      setCurrency(currencyCopy || null);
      setIsCurrencySet(Boolean(currency));
    })();
  }, [isResourceAccountSet, abi]);

  useEffect(() => {
    void (async () => {
      const addresses = await abi?.useABI(feesABI).view.get_collectors({
        typeArguments: [],
        functionArguments: [],
      });

      const subscribers = await Promise.all(
        addresses?.[0].map(async (a) => {
          const isSubscriber = await abi
            ?.useABI(feesABI)
            .view.check_collector_object({
              typeArguments: [],
              functionArguments: [a],
            });

          return Boolean(isSubscriber?.[0]);
        }) || []
      );

      setCollectorsSubscribed([
        ...(addresses?.[0]?.filter(
          (_a, i) => subscribers[i]
        ) as `0x${string}`[]),
      ]);

      setCollectorsNotSubscribed([
        ...(addresses?.[0]?.filter(
          (_a, i) => !subscribers[i]
        ) as `0x${string}`[]),
      ]);
    })();
  }, [abi, isResourceAccountSet]);

  const onAddInitialCollector = async () => {
    setCollectorsNotSubscribed([
      ...collectorsNotSubscribed,
      newAddress as `0x${string}`,
    ]);
    setInitialCollectors([...initialCollectors, newAddress as `0x${string}`]);
    setNewAddress('' as `0x${string}`);
  };

  const onAddFees = (salary: number, employee: number) => {
    const feesCopy = [...fees];

    feesCopy[employee] = salary;

    setFees([...feesCopy]);
  };

  const onCreateResourceAccount = async () => {
    if (!connected) {
      return;
    }

    try {
      const tx = await client?.useABI(feesABI).create_resource_account({
        type_arguments: [],
        arguments: [RESOURCE_ACCOUNT_SEED as string, [...initialCollectors]],
      });

      toast({
        title: 'Created resource account',
        description: (
          <a
            href={`https://explorer.aptoslabs.com/txn/${tx?.hash}`}
            target="_blank"
          >
            {tx?.hash}
          </a>
        ),
        variant: 'default',
      });

      const resourceAccountAddressResult = await abi
        ?.useABI(feesABI)
        .view.get_resource_account_address({
          typeArguments: [],
          functionArguments: [],
        });

      setResourceAccount(resourceAccountAddressResult?.[0] as `0x${string}`);

      setIsResourceAccountSet(true);
    } catch (error) {
      toast({
        title: 'Error creating resource account',
        description: `${error}`,
        variant: 'destructive',
      });
    }
  };

  const onPayCollectors = async () => {
    try {
      const tx = await client?.useABI(feesABI).payment({
        type_arguments: [],
        arguments: [
          [...collectorsSubscribed],
          [...fees.map((s) => convertAmountFromHumanReadableToOnChain(s, 8))],
        ],
      });

      toast({
        title: 'Paid collectors',
        description: (
          <a
            href={`https://explorer.aptoslabs.com/txn/${tx?.hash}`}
            target="_blank"
          >
            {tx?.hash}
          </a>
        ),
        variant: 'default',
      });

      setFees([...collectorsSubscribed.map(() => 0)]);
    } catch (error) {
      toast({
        title: 'Error paying collectors',
        description: `${error}`,
        variant: 'destructive',
      });
    }
  };

  const onUptateCurrency = async () => {
    try {
      const tx = await client?.useABI(feesABI).set_currency({
        type_arguments: [],
        arguments: [currency as `0x${string}`],
      });

      toast({
        title: 'Set Currency',
        description: (
          <a
            href={`https://explorer.aptoslabs.com/txn/${tx?.hash}`}
            target="_blank"
          >
            {tx?.hash}
          </a>
        ),
        variant: 'default',
      });

      setIsCurrencySet(true);
    } catch (error) {
      toast({
        title: 'Error setting the currency',
        description: `${error}`,
        variant: 'destructive',
      });
    }
  };

  const onAddCurrency = () => {
    if (!newCurrency.address || !newCurrency.name || !newCurrency.symbol) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all currency fields',
        variant: 'destructive',
      });
      return;
    }

    // Check if currency already exists
    if (currencies.some(c => c.address === newCurrency.address)) {
      toast({
        title: 'Currency already exists',
        description: 'This currency is already in the list',
        variant: 'destructive',
      });
      return;
    }

    setCurrencies([...currencies, newCurrency]);
    setNewCurrency({
      address: '' as `0x${string}`,
      name: '',
      symbol: '',
      isStableCoin: false
    });

    toast({
      title: 'Currency added',
      description: `${newCurrency.name} (${newCurrency.symbol}) has been added to the list`,
      variant: 'default',
    });
  };

  const onRemoveCurrency = (address: `0x${string}`) => {
    setCurrencies(currencies.filter(c => c.address !== address));
    
    // If the removed currency is the selected one, reset to the first available
    if (selectedPaymentCurrency === address && currencies.length > 1) {
      const remainingCurrencies = currencies.filter(c => c.address !== address);
      if (remainingCurrencies.length > 0) {
        setSelectedPaymentCurrency(remainingCurrencies[0].address);
      }
    }
  };

  const onSavePaymentCurrency = async () => {
    try {
      // In a real implementation, this would call the backend API
      // await api.updatePaymentCurrency(selectedPaymentCurrency);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast({
        title: 'Payment currency updated',
        description: `The payment currency has been updated successfully`,
        variant: 'default',
      });
    } catch (error) {
      toast({
        title: 'Error updating payment currency',
        description: `${error}`,
        variant: 'destructive',
      });
    }
  };

  const onSaveCurrencies = async () => {
    try {
      // In a real implementation, this would call the backend API
      // await api.updateCurrencies(currencies);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast({
        title: 'Currencies updated',
        description: `The currencies list has been updated successfully`,
        variant: 'default',
      });
    } catch (error) {
      toast({
        title: 'Error updating currencies',
        description: `${error}`,
        variant: 'destructive',
      });
    }
  };

  // Calculate if resource account creation should be disabled
  const disabledCreateResourceAccount = !initialCollectors.length || !isCurrencySet;

  // Reuse the existing render logic but add the new currency management UI
  return (
    <div className="space-y-6">
      {/* Currency Management Section */}
      <div className="space-y-4 border-b pb-6">
        <h3 className="font-semibold text-lg">Currency Management</h3>
        
        {/* Available Currencies */}
        <div className="space-y-2">
          <Label>Available Currencies</Label>
          <div className="space-y-2 max-h-[200px] overflow-y-auto p-2 border rounded-md">
            {currencies.map((curr, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                <div>
                  <span className="font-medium">{curr.symbol}</span>
                  <span className="text-sm text-gray-500 ml-2">({curr.name})</span>
                  <span className="text-xs text-gray-400 block truncate" title={curr.address}>
                    {curr.address}
                  </span>
                  <span className="text-xs text-gray-500">
                    {curr.isStableCoin ? 'Stable Coin' : 'Crypto Currency'}
                  </span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => onRemoveCurrency(curr.address)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
        
        {/* Add New Currency */}
        <div className="space-y-2 p-4 bg-gray-50 rounded-md">
          <h4 className="font-medium">Add New Currency</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <LabeledInput
              id="currency-address"
              label="Currency Address"
              tooltip="The blockchain address of the currency"
              required={true}
              value={newCurrency.address}
              onChange={(e) => setNewCurrency({...newCurrency, address: e.target.value as `0x${string}`})}
              type="text"
            />
            <LabeledInput
              id="currency-name"
              label="Currency Name"
              tooltip="The full name of the currency"
              required={true}
              value={newCurrency.name}
              onChange={(e) => setNewCurrency({...newCurrency, name: e.target.value})}
              type="text"
            />
            <LabeledInput
              id="currency-symbol"
              label="Currency Symbol"
              tooltip="The symbol/ticker of the currency"
              required={true}
              value={newCurrency.symbol}
              onChange={(e) => setNewCurrency({...newCurrency, symbol: e.target.value})}
              type="text"
            />
            <div className="flex items-center space-x-2 mt-6">
              <input
                type="checkbox"
                id="is-stable-coin"
                checked={newCurrency.isStableCoin}
                onChange={(e) => setNewCurrency({...newCurrency, isStableCoin: e.target.checked})}
                className="h-4 w-4"
              />
              <Label htmlFor="is-stable-coin">Is Stable Coin</Label>
            </div>
          </div>
          <Button
            className="w-full mt-4"
            variant="outline"
            onClick={onAddCurrency}
            disabled={!newCurrency.address || !newCurrency.name || !newCurrency.symbol}
          >
            Add Currency
          </Button>
        </div>
        
        <Button
          className="w-full"
          variant="green"
          onClick={onSaveCurrencies}
        >
          Save Currency List
        </Button>
      </div>
      
      {/* Collector Payment Currency Selection */}
      <div className="space-y-4 pt-4 border-b pb-6">
        <h3 className="font-semibold text-lg">Collector Payment Currency</h3>
        <div className="space-y-2">
          <Label>Select Currency for Paying Collectors</Label>
          <Select 
            value={selectedPaymentCurrency} 
            onValueChange={(value) => setSelectedPaymentCurrency(value as `0x${string}`)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a currency" />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((curr, index) => (
                <SelectItem key={index} value={curr.address}>
                  {curr.symbol} - {curr.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          className="w-full"
          variant="green"
          onClick={onSavePaymentCurrency}
        >
          Save Payment Currency
        </Button>
      </div>
      
      {/* Original Fees Component UI */}
      <div className="space-y-6 pt-4">
        <h3 className="font-semibold text-lg">Resource Account & Collectors</h3>
        
        {isResourceAccountSet ? (
          <>
            {/* Account Info */}
            <div className="space-y-4">
              <LabeledInput
                id="resource-account-address-input"
                label="Account Address"
                value={resourceAccount as `0x${string}`}
                type="text"
                readOnly
              />
              <LabeledInput
                id={'resource-account-balance-input'}
                label="Balance"
                value={resourceAccountBalance.toString()}
                type="text"
                readOnly
              />
              <LabeledInput
                id={'resource-account-currency-input'}
                label="Current Currency"
                value={currency || ''}
                type="text"
                readOnly
              />
            </div>

            {/* Collectors Section */}
            <div className="space-y-4">
              {Boolean(collectorsNotSubscribed.length) && (
                <div className="space-y-2">
                  <h3 className="font-semibold">
                    Collectors not subscribed yet:
                  </h3>
                  {collectorsNotSubscribed.map((e, i) => (
                    <LabeledInput
                      id={`collector-${i}-address`}
                      key={`${i}-${e}`}
                      label={`Collector ${i + 1}`}
                      value={e}
                      type="text"
                      readOnly
                    />
                  ))}
                </div>
              )}

              {Boolean(collectorsSubscribed.length) && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Subscribed collectors:</h3>
                  {collectorsSubscribed.map((e, i) => (
                    <div key={`${i}-${e}`} className="space-y-2">
                      <LabeledInput
                        id={`collector-${i}-address`}
                        label={`Collector ${i + 1}`}
                        value={e}
                        type="text"
                        readOnly
                      />
                      <LabeledInput
                        id={`collector-fees-${i}`}
                        label="Fees"
                        tooltip="The fees to pay to the collector"
                        required={true}
                        value={fees[i]}
                        onChange={(e) => onAddFees(Number(e.target.value), i)}
                        type="number"
                      />
                    </div>
                  ))}
                </div>
              )}

              <Button
                className="w-full"
                variant="green"
                onClick={onPayCollectors}
                disabled={!collectorsSubscribed.length}
              >
                Pay collectors
              </Button>
            </div>
          </>
        ) : (
          // Resource Account Creation Section
          <div className="space-y-6">
            <div className="space-y-4">
              <LabeledInput
                id="fees-address"
                label="Address initial collector"
                tooltip="The wallet address of the initial collector"
                required={true}
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value as `0x${string}`)}
                type="text"
              />
              <Button
                className="w-full"
                variant="outline"
                onClick={onAddInitialCollector}
                disabled={!newAddress}
              >
                Add Initial collector
              </Button>
            </div>

            {initialCollectors.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold">Initial Collectors</h3>
                {initialCollectors.map((e, i) => (
                  <LabeledInput
                    id={`initial-collector-${i}-address`}
                    key={`${i}-${e}`}
                    label={`Collector ${i + 1}`}
                    value={e}
                    type="text"
                    readOnly
                  />
                ))}
              </div>
            )}

            <Button
              className="w-full"
              variant="green"
              disabled={disabledCreateResourceAccount}
              onClick={onCreateResourceAccount}
            >
              Create resource account and set currency
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}; 