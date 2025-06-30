import { useEffect, useState } from 'react';
import Sidebar from '../components/sidebar';

function Portfolio() {
  const [assets, setAssets] = useState([]);
  const [name, setName] = useState('');
  const [assetType, setAssetType] = useState("");
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
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-6 sm:p-8 overflow-y-auto">
        <h1 className="text-3xl font-bold text-blue-800 mb-6">My Portfolio</h1>

      
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-blue-100 rounded-lg p-4 shadow hover:shadow-lg transition-all">
            <p className="text-gray-700">Total Assets</p>
            <p className="text-2xl font-bold text-blue-900">₹{assets.reduce((acc, a) => acc + Number(a.amount || 0), 0)}</p>
          </div>
          <div className="bg-green-100 rounded-lg p-4 shadow hover:shadow-lg transition-all">
            <p className="text-gray-700">Asset Count</p>
            <p className="text-2xl font-bold text-green-900">{assets.length}</p>
          </div>
          <div className="bg-purple-100 rounded-lg p-4 shadow hover:shadow-lg transition-all">
            <p className="text-gray-700">Last Added</p>
            <p className="text-xl text-purple-900">{assets[assets.length - 1]?.name || "N/A"}</p>
          </div>
        </div>

        
        <div className="bg-white rounded-lg p-6 shadow mb-8 max-w-md">
          <h2 className="text-xl font-semibold mb-4 text-blue-700">Add New Asset</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-700">Name</label>
              <input
                type="text"
                className="w-full border rounded p-2"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-gray-700">Type</label>
              <select
                className="w-full border rounded p-2"
                value={assetType}
                onChange={(e) => setAssetType(e.target.value)}
                required
              >
                <option value="">Select Type</option>
                <option value="Stock">Stock</option>
                <option value="Crypto">Crypto</option>
                <option value="Bond">Bond</option>
                <option value="Real Estate">Real Estate</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-700">Amount (₹)</label>
              <input
                type="number"
                className="w-full border rounded p-2"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
              Add Asset
            </button>
          </form>
        </div>

        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-700">Your Assets</h2>
          {assets.length === 0 ? (
            <p className="text-gray-600">No assets added yet.</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {assets.map((asset, idx) => (
                <li key={idx} className="py-3 flex justify-between items-center">
                  <span className="font-medium text-gray-800">
                    {asset.name} ({asset.type})
                  </span>
                  <span className="text-blue-800 font-bold">₹{asset.amount}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}

export default Portfolio;
