import { useEffect, useState } from "react";
import Sidebar from "../components/sidebar";

const API_URL = "http://localhost:5000/api";

function Portfolio() {
  const [assets, setAssets] = useState([]);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("");

  // fetch existing assets
  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_URL}/assets`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        setAssets(data);
      } catch (err) {
        console.error("Fetch error", err);
      }
    };

    fetchAssets();
  }, []);

  // handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/assets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, amount, type }),
      });
      if (!response.ok) {
        throw new Error("Error adding asset");
      }
      const newAsset = await response.json();
      setAssets([...assets, newAsset]);
      setName("");
      setAmount("");
      setType("");
    } catch (err) {
      console.error("Add asset error", err);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-6 sm:p-8">
        <h1 className="text-3xl font-bold text-blue-800 mb-6">Portfolio</h1>

        {/* Add asset form */}
        <form
          onSubmit={handleSubmit}
          className="mb-8 bg-white p-6 rounded shadow max-w-md"
        >
          <h2 className="text-xl font-semibold mb-4">Add New Asset</h2>
          <div className="space-y-4">
            <div>
              <label className="block mb-1">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block mb-1">Amount</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block mb-1">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full border rounded px-3 py-2"
                required
              >
                <option value="">Select type</option>
                <option value="Crypto">Crypto</option>
                <option value="Stocks">Stocks</option>
                <option value="Mutual Funds">Mutual Funds</option>
                <option value="Gold">Gold</option>
              </select>
            </div>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              Add Asset
            </button>
          </div>
        </form>

        {/* Display assets */}
        <h2 className="text-xl font-semibold mb-4">My Assets</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {assets.length === 0 && (
            <p className="text-gray-600">No assets added yet.</p>
          )}
          {assets.map((asset) => (
            <div
              key={asset._id}
              className="bg-blue-100 rounded p-4 shadow text-blue-900"
            >
              <h3 className="font-bold">{asset.name}</h3>
              <p>Amount: ₹{asset.amount}</p>
              <p>Type: {asset.type}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default Portfolio;
