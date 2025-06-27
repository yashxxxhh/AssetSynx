import { useState } from 'react';
import { FiHome, FiLogOut, FiPieChart, FiSettings, FiUser } from 'react-icons/fi';
import { NavLink, useNavigate } from 'react-router-dom';

const links = [
  { path: '/dashboard', label: 'Dashboard', icon: <FiHome size={20} /> },
  { path: '/portfolio', label: 'Portfolio', icon: <FiPieChart size={20} /> },
  { path: '/settings', label: 'Settings', icon: <FiSettings size={20} /> },
];

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
  localStorage.removeItem('authToken');  // clear token if you use it
  window.location.href = '/login';       // simple hard redirect to login page
};


  return (
    <div
      className={`flex flex-col h-screen bg-blue-900 text-white transition-width duration-300
      ${isCollapsed ? 'w-16' : 'w-64'}`}
    >
      {/* Logo + Toggle */}
      <div className="flex items-center justify-between p-4 border-b border-blue-700">
        {!isCollapsed && <h1 className="text-xl font-bold tracking-wide">Assetsynx</h1>}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-blue-300 hover:text-white focus:outline-none"
          aria-label="Toggle sidebar"
        >
          {isCollapsed ? '▶' : '◀'}
        </button>
      </div>

      {/* Nav Links */}
      <nav className="flex flex-col flex-grow mt-4">
        {links.map(({ path, label, icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 mx-2 rounded-md hover:bg-blue-700 transition-all duration-200
              ${isActive ? 'bg-blue-800 font-semibold' : 'text-blue-300'}`
            }
          >
            {icon}
            {!isCollapsed && <span className="text-sm">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Account icon bottom right + Logout */}
      <div className="mt-auto p-4 border-t border-blue-700 flex flex-col gap-2">
        <div className="flex items-center justify-end gap-2">
          {!isCollapsed && <span className="text-sm text-blue-300">Account</span>}
          <button className="rounded-full bg-blue-700 hover:bg-blue-600 p-2 focus:outline-none">
            <FiUser size={22} />
          </button>
        </div>

        {/* Logout button */}
        <button
          onClick={handleLogout}
          className="flex items-center justify-end gap-2 text-red-400 hover:text-red-600 focus:outline-none"
          aria-label="Logout"
        >
          <FiLogOut size={22} />
          {!isCollapsed && <span className="text-sm">Logout</span>}
        </button>
      </div>
    </div>
  );
}
