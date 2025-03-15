import React, { useState, useEffect } from 'react';

const BalanceDashboard = () => {
  const [balances, setBalances] = useState({
    coinV1: 0,
    coinV2: 0,
    claimableV1: 0,
    claimableV2: 0
  });

  // Simulate fetching balance data periodically
  useEffect(() => {
    const fetchBalances = async () => {
      // Simulate API call with random values
      const newBalances = {
        coinV1: Math.floor(Math.random() * 1000),
        coinV2: Math.floor(Math.random() * 500),
        claimableV1: Math.floor(Math.random() * 400),
        claimableV2: Math.floor(Math.random() * 200)
      };
      setBalances(newBalances);
    };

    fetchBalances();
    const interval = setInterval(fetchBalances, 10000); // update every 10s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-4 border rounded-xl shadow-lg bg-white">
      <h3 className="text-xl font-bold mb-4">Collector Balance Dashboard</h3>
      <div className="space-y-2">
        <div>Coins V1 Balance: {balances.coinV1}</div>
        <div>Coins V2 Balance: {balances.coinV2}</div>
        <div>Claimable Coins V1: {balances.claimableV1}</div>
        <div>Claimable Coins V2: {balances.claimableV2}</div>
      </div>
    </div>
  );
};

export default BalanceDashboard; 