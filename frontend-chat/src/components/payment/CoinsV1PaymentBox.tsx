import React, { useState } from 'react';

const CoinsV1PaymentBox = () => {
  const [coinType, setCoinType] = useState("APT");
  
  // Multi payment fields: an array of { address, amount }
  const [payments, setPayments] = useState([{ address: "", amount: "" }]);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate payment rows
    for (const payment of payments) {
      const amt = Number(payment.amount);
      if (!payment.address) {
        setError("Please enter collector address for all payments.");
        return;
      }
      if (isNaN(amt) || amt <= 0) {
        setError("Please enter a valid amount for each collector.");
        return;
      }
    }
    
    setError(null);
    setLoading(true);
    try {
      // Simulate API calls for each payment (sequentially for simulation)
      for (const payment of payments) {
        const amt = Number(payment.amount);
        await new Promise(res => setTimeout(res, 500));
        // In a real implementation, you would call the API to process each payment
      }
      alert(`Payments processed for ${coinType} to ${payments.length} collectors.`);
    } catch (err) {
      setError("Payment failed.");
    }
    setLoading(false);
  };

  const handleAddPayment = () => {
    setPayments([...payments, { address: "", amount: "" }]);
  };

  const handleRemovePayment = (index: number) => {
    const newPayments = payments.filter((_, i) => i !== index);
    setPayments(newPayments);
  };

  const handlePaymentChange = (index: number, field: 'address' | 'amount', value: string) => {
    const newPayments = payments.map((payment, i) =>
      i === index ? { ...payment, [field]: value } : payment
    );
    setPayments(newPayments);
  };

  return (
    <div className="p-4 border rounded-xl shadow-lg bg-white">
      <form onSubmit={handlePayment}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Coin Type</label>
          <select
            value={coinType}
            onChange={(e) => setCoinType(e.target.value)}
            className="border p-2 w-full rounded mb-2 bg-white"
          >
            <option value="APT">APT</option>
            <option value="COIN1">Coin1</option>
            <option value="COIN2">Coin2</option>
          </select>
        </div>
        
        <div className="mb-4">
          <h4 className="font-medium text-gray-800 mb-2">Collector Payments</h4>
          {payments.map((payment, index) => (
            <div key={index} className="mb-4 p-4 border rounded-lg bg-gray-50">
              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Collector Address</label>
                <input
                  type="text"
                  value={payment.address}
                  onChange={(e) => handlePaymentChange(index, 'address', e.target.value)}
                  className="border p-2 w-full rounded bg-white"
                  placeholder="Enter collector address"
                />
              </div>
              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input
                  type="text"
                  value={payment.amount}
                  onChange={(e) => handlePaymentChange(index, 'amount', e.target.value)}
                  className="border p-2 w-full rounded bg-white"
                  placeholder="Enter amount"
                />
              </div>
              {payments.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemovePayment(index)}
                  className="bg-red-600 hover:bg-red-700 text-white py-1 px-2 rounded text-sm"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddPayment}
            className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded mb-4"
          >
            Add Collector
          </button>
        </div>
        
        {error && <p className="text-red-500 mb-2">{error}</p>}
        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded w-full" disabled={loading}>
          {loading ? "Processing..." : `Distribute ${coinType} to Collectors`}
        </button>
      </form>
    </div>
  );
};

export default CoinsV1PaymentBox; 