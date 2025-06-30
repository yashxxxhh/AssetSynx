import { Navigate } from "react-router-dom";
localStorage.setItem("token", "testtoken");





export default function PrivateRoute({ children }) {
  const isLoggedIn = localStorage.getItem("loggedIn") === "true";
  return isLoggedIn ? children : <Navigate to="/auth" />;
}
