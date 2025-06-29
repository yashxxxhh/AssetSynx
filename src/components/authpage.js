import React, { useState } from "react";
import { useEffect } from "react";


function AuthPage() {

  useEffect(() => {
    localStorage.clear();
    alert("Local storage cleared on default page load.");
  }, []);

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  

    const handleAuth = (e) => {
    e.preventDefault();
    if (isLogin) {
      const stored = JSON.parse(localStorage.getItem("user"));
      if (stored && stored.email === email && stored.password === password) {
        localStorage.setItem("loggedIn", "true");
        window.location.href = "/dashboard";
      } else {
        alert("Invalid credentials. Please sign up first.");
      }
    } else {
      if (localStorage.getItem("user")) {
        alert("Account already exists. Please log in instead.");
        setIsLogin(true);
        return;
      }
      localStorage.setItem("user", JSON.stringify({ email, password }));
      alert("User registered, please login");
      setIsLogin(true);
    }
  };


  return (
    <div className="flex items-center justify-center min-h-screen bg-blue-100">
      <div className="bg-white p-8 rounded shadow w-96">
        <h1 className="text-2xl mb-4 text-blue-800 font-bold">
          {isLogin ? "Login" : "Signup"}
        </h1>
        <form onSubmit={handleAuth} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="border p-2 w-full rounded"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            className="border p-2 w-full rounded"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="submit"
            className="bg-blue-600 text-white w-full py-2 rounded hover:bg-blue-700"
          >
            {isLogin ? "Login" : "Signup"}
          </button>
        </form>
        <button
          className="mt-4 text-blue-600 underline"
          onClick={() => setIsLogin(!isLogin)}
        >
          {isLogin ? "Create new account" : "Already have an account?"}
        </button>
      </div>
    </div>
  );
}

export default AuthPage;
