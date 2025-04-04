import React, { useState } from 'react';
import { Button } from './button';
import { ScrollArea } from './scrollarea';
import { X, Calculator, DollarSign } from 'lucide-react';
import Link from 'next/link';

interface RightSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

interface MiniAppProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const MiniApp: React.FC<MiniAppProps> = ({ title, icon, children }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h3 className="font-medium text-sm">{title}</h3>
      </div>
      {children}
    </div>
  );
};

export const RightSidebar: React.FC<RightSidebarProps> = ({
  isOpen = false,
  onClose,
}) => {
  const [amount, setAmount] = useState<string>('');
  const [fromCurrency, setFromCurrency] = useState<string>('USD');
  const [toCurrency, setToCurrency] = useState<string>('EUR');
  const [conversionRate, setConversionRate] = useState<number>(0.92);
  const [result, setResult] = useState<string>('');

  return (
    <>
      {/* Backdrop overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" 
          onClick={onClose}
        />
      )}
      <div className={`
        fixed top-0 right-0 h-[100dvh] w-80 border-l border-border
        bg-white
        transform transition-transform duration-300 ease-in-out z-50
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-border h-[73px] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="grid grid-cols-2 gap-0.5 w-4 h-4">
                <div className="bg-blue-500 rounded-sm"></div>
                <div className="bg-blue-500 rounded-sm"></div>
                <div className="bg-blue-500 rounded-sm"></div>
                <div className="bg-blue-500 rounded-sm"></div>
              </div>
              <h2 className="text-lg font-semibold">Super-Apps</h2>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="flex items-center justify-center h-9 w-9 rounded-full hover:bg-gray-100"
                aria-label="Close Mini Apps"
                title="Close Mini Apps"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-6">
              {/* Subscription Apps Section */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-700">Subscription Apps</h3>
                <Link href={process.env.NEXT_LEDGER_APP_URL || 'https://ledgerapp.fun'}>
                  <Button className="w-full justify-start gap-2 p-4">
                    <span className="text-xl">📒</span>
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Ledger App</span>
                      <span className="text-xs text-gray-500">Infinite DIY NFT collection</span>
                    </div>
                  </Button>
                </Link>
              </div>

              {/* Pay-per-use Apps Section */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-700">Pay-per-use Apps</h3>
              </div>

              {/* Free Apps Section */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-700">Free Apps</h3>
                <MiniApp
                  title="Calculator"
                  icon={<Calculator className="h-4 w-4 text-blue-500" />}
                >
                  <div className="grid grid-cols-4 gap-2">
                    {['7', '8', '9', '/', '4', '5', '6', '*', '1', '2', '3', '-', '0', '.', '=', '+'].map((btn) => (
                      <button
                        key={btn}
                        className="p-2 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                        onClick={() => {
                          if (btn === '=') {
                            try {
                              setResult(eval(result).toString());
                            } catch {
                              setResult('Error');
                            }
                          } else {
                            setResult(prev => prev + btn);
                          }
                        }}
                      >
                        {btn}
                      </button>
                    ))}
                  </div>
                  <div className="mt-2 p-2 bg-gray-50 rounded text-right">
                    {result || '0'}
                  </div>
                </MiniApp>

                <MiniApp
                  title="Currency Converter"
                  icon={<DollarSign className="h-4 w-4 text-yellow-500" />}
                >
                  <div className="space-y-2">
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full p-2 border rounded text-sm"
                      placeholder="Amount"
                    />
                    <div className="flex gap-2">
                      <select
                        value={fromCurrency}
                        onChange={(e) => setFromCurrency(e.target.value)}
                        className="flex-1 p-2 border rounded text-sm"
                      >
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                      </select>
                      <select
                        value={toCurrency}
                        onChange={(e) => setToCurrency(e.target.value)}
                        className="flex-1 p-2 border rounded text-sm"
                      >
                        <option value="EUR">EUR</option>
                        <option value="USD">USD</option>
                        <option value="GBP">GBP</option>
                      </select>
                    </div>
                    <div className="p-2 bg-gray-50 rounded text-sm">
                      {(parseFloat(amount) * conversionRate).toFixed(2)} {toCurrency}
                    </div>
                  </div>
                </MiniApp>
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>
    </>
  );
}; 