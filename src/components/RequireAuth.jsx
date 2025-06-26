// src/components/RequireAuth.jsx
import React, { useContext } from "react"; // Import useContext
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx"; // Import AuthContext

const RequireAuth = ({ children }) => {
  const { isAuthenticated, loading } = useContext(AuthContext); // Get isAuthenticated and loading from AuthContext
  const location = useLocation();

  // --- CRITICAL CHANGE: Handle loading state from AuthContext ---
  if (loading) {
    // Optionally render a loading spinner or message while authentication status is being determined
    return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading authentication...</div>;
  }

  // --- CRITICAL CHANGE: Use isAuthenticated from AuthContext ---
  if (!isAuthenticated) {
    // Redirect to login page, but keep current location for redirect after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default RequireAuth;