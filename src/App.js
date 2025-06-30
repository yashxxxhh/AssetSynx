import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import AuthPage from "./components/authpage";
import Dashboard from "./pages/Dashboard";
import Portfolio from "./pages/Portfolio";
import PrivateRoute from "./privateroute";
import Settings from "./pages/settings";




function App() {
  return (
    <Router>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/portfolio"
          element={
            <PrivateRoute>
              <Portfolio />
            </PrivateRoute>
          }
        />
 <Route
  path="/settings"
  element={
    <PrivateRoute>
      <Settings />
    </PrivateRoute>
  }
/>

        <Route path="*" element={<AuthPage />} />
      </Routes>
    </Router>
  );
}

export default App;
