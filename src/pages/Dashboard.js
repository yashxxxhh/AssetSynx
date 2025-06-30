import { useEffect, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import Sidebar from '../components/sidebar';

function Dashboard() {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const savedAssets = JSON.parse(localStorage.getItem('assets')) || [];
    const transformed = savedAssets.map(asset => ({
      name: asset.name,
      value: asset.amount
    }));
    setChartData(transformed);
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-6 sm:p-8">
        <h1 className="text-3xl font-bold text-blue-800 mb-6">Dashboard</h1>
        <p className="mb-4 text-gray-600">
          Welcome to <span className="font-semibold text-blue-700">Assetsynx</span> — Your one-stop solution for managing your portfolio.
        </p>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-700">Portfolio Trend</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
