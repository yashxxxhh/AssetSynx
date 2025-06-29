import { useEffect, useState } from 'react';
import Sidebar from '../components/sidebar';

function Portfolio() {
  const [assets, setAssets] = useState([]);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');


  useEffect(() => {
    const savedAssets = JSON.parse(localStorage.getItem('assets')) || [];
    setAssets(savedAssets);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const newAsset = { name, amount };
    const updatedAssets = [...assets, newAsset];
    setAssets(updatedAssets);
    localStorage.setItem('assets', JSON.stringify(updatedAssets));
    setName('');
    setAmount('');
  };
  

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6">
        <h1 className="text-3xl font-bold text-blue-800 mb-4">Portfolio</h1>

        <form onSubmit={handleSubmit} className="mb-6 space-y-4">
          <input
            type="text"
            placeholder="Asset name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border p-2 rounded w-full"
            required
          />
          <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="border p-2 rounded w-full"
            required
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Add Asset
          </button>
        </form>

        <div>
          <h2 className="text-xl font-semibold mb-2 text-blue-700">Your Assets</h2>
          {assets.length > 0 ? (
            <ul className="space-y-2">
              {assets.map((asset, idx) => (
                <li key={idx} className="bg-blue-100 rounded p-2 shadow">
                  {asset.name}: ₹{asset.amount}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600">No assets yet.</p>
          )}
        </div>
      </main>
    </div>
  );
}

export default Portfolio;
