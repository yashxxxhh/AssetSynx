export default function Header() {
  return (
    <header className="bg-white shadow px-6 py-4 flex justify-between items-center">
      <h2 className="text-xl font-semibold">Assetsynx</h2>
      <div>
        {/* Placeholder for user avatar / notifications */}
        <span className="text-gray-600">User</span>
      </div>
    </header>
  );
}
