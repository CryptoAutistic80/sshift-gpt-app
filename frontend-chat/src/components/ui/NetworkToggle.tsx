import { Chain } from '@helpers';

interface NetworkToggleProps {
  selectedNetwork: Chain;
  onToggle: () => void;
}

export function NetworkToggle({
  selectedNetwork,
  onToggle,
}: NetworkToggleProps) {
  return (
    <div className="flex items-center space-x-3 mb-4">
      <span
        className={`text-sm ${
          selectedNetwork === 'aptos'
            ? 'text-black font-bold'
            : 'text-gray-500 font-medium'
        }`}
      >
        APTOS
      </span>
      <button
        type="button"
        className={`relative inline-flex h-6 w-11 items-center rounded-full bg-gray-600 transition-colors duration-200 ease-in-out`}
        role="switch"
        aria-checked={selectedNetwork === Chain.Movement}
        onClick={onToggle}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${
            selectedNetwork === Chain.Movement
              ? 'translate-x-6'
              : 'translate-x-1'
          }`}
        />
      </button>
      <span
        className={`text-sm ${
          selectedNetwork === Chain.Movement
            ? 'text-black font-bold'
            : 'text-gray-500 font-medium'
        }`}
      >
        MOVEMENT
      </span>
    </div>
  );
}
