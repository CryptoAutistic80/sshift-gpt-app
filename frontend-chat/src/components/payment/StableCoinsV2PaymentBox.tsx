import React, { useState } from 'react';

const StableCoinsV2PaymentBox = () => {
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter a valid amount.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      // Simulate API call for Stable Coins V2 payment processing.
      await new Promise(res => setTimeout(res, 1000));
      alert("Payment processed for Stable Coins V2");
    } catch (err) {
      setError("Payment failed.");
    }
    setLoading(false);
  };

  return (
    <div className="p-4 border rounded-xl shadow-lg bg-white">
      <h3 className="text-xl font-bold mb-4">Stable Coins V2 Payment</h3>
      <form onSubmit={handlePayment}>
        <input
          type="text"
          className="border p-2 w-full mb-2"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter amount"
        />
        {error && <p className="text-red-500 mb-2">{error}</p>}
        <button type="submit" className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded" disabled={loading}>
          {loading ? "Processing..." : "Pay with Stable Coins V2"}
        </button>
      </form>
    </div>
  );
};

export default StableCoinsV2PaymentBox; 