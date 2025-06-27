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

const data = [
  { name: 'Jan', value: 1000 },
  { name: 'Feb', value: 1500 },
  { name: 'Mar', value: 1200 },
  { name: 'Apr', value: 1700 },
  { name: 'May', value: 2000 },
];

function Dashboard() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-6 sm:p-8">
        <h1 className="text-3xl font-bold text-blue-800 mb-2">Dashboard</h1>
        <p className="text-gray-600 mb-6">
          Welcome to <span className="font-semibold text-blue-700">Assetsynx</span> — Your one-stop
          solution for tracking and managing your financial portfolio.
        </p>

        {/* Asset Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-blue-100 rounded-lg p-4 shadow">
            <p className="text-gray-700">Total Assets</p>
            <p className="text-3xl font-bold text-blue-900">₹2,00,000</p>
          </div>
          <div className="bg-blue-100 rounded-lg p-4 shadow">
            <p className="text-gray-700">Investments</p>
            <p className="text-3xl font-bold text-blue-900">₹1,25,000</p>
          </div>
          <div className="bg-blue-100 rounded-lg p-4 shadow">
            <p className="text-gray-700">Savings</p>
            <p className="text-3xl font-bold text-blue-900">₹75,000</p>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-700">Portfolio Trend</h2>
          <div className="h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
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
