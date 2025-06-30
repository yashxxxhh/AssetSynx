import { useState } from 'react';

export default function Settings() {
  const [username, setUsername] = useState('Xyz');
  const [email, setEmail] = useState('Xyz@example.com');
  const [notifications, setNotifications] = useState(true);

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`✅ Settings saved:\n\nUsername: ${username}\nEmail: ${email}\nNotifications: ${notifications ? 'On' : 'Off'}`);
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gradient-to-r from-blue-100 to-blue-200 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <h1 className="text-4xl font-extrabold text-blue-700 mb-8 text-center">
          Settings
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="username"
              className="block text-gray-800 font-semibold mb-1"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-gray-800 font-semibold mb-1"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center">
            <input
              id="notifications"
              type="checkbox"
              checked={notifications}
              onChange={() => setNotifications(!notifications)}
              className="mr-2 h-4 w-4 text-blue-600"
            />
            <label
              htmlFor="notifications"
              className="text-gray-800 font-semibold"
            >
              Enable Notifications
            </label>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition-all duration-200 ease-in-out shadow"
          >
            Save Settings
          </button>
        </form>
      </div>
    </div>
  );
}
