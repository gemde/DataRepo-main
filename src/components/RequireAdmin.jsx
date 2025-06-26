import React, { useEffect, useContext } from "react"; // Import useContext
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext"; // Import AuthContext

const RequireAdmin = ({ children }) => {
  const navigate = useNavigate();
  // --- IMPORTANT: Consume AuthContext's states including 'loading' ---
  const { user, token, loading: authLoading } = useContext(AuthContext);

  useEffect(() => {
    // 1. Wait for AuthContext to finish its initial loading process
    if (authLoading) {
      return; // Do nothing while authentication context is still loading
    }

    // 2. After loading, check if authenticated at all
    if (!token || !user) {
      navigate("/login"); // Not logged in, redirect to login
      return; // Stop execution
    }

    // 3. After authentication, check if user has admin role
    if (user.role !== "admin") {
      navigate("/dashboard"); // Logged in, but not an admin, redirect to general dashboard
      return; // Stop execution
    }

    // If all checks pass, allow children to render (no explicit action needed here)

  }, [user, token, authLoading, navigate]); // Add all consumed context values to dependencies

  // --- Render logic based on loading and role status ---
  // While AuthContext is loading, render nothing or a loading spinner
  if (authLoading) {
    return <div>Loading authentication...</div>; // Or a proper loading spinner component
  }

  // If AuthContext has loaded, and user is an admin, render children
  // Otherwise, if not authenticated or not admin, useEffect will handle redirect.
  // We return null here because the useEffect will handle the navigation away if conditions aren't met.
  return (token && user?.role === "admin") ? children : null;
};

export default RequireAdmin;
