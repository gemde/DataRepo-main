import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const TopNavigationBar = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));

  useEffect(() => {
    // Listen for changes in token (optional but handy if other components change it)
    const checkLoginStatus = () => {
      setIsLoggedIn(!!localStorage.getItem('token'));
    };

    window.addEventListener('storage', checkLoginStatus);
    return () => window.removeEventListener('storage', checkLoginStatus);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false); // trigger re-render
    navigate('/login');
  };

  return (
    <nav className="flex justify-between items-center bg-gray-800 text-white p-4">
      <Link to="/" className="text-xl font-bold">DataHub</Link>

      <div className="space-x-4">
        <Link to="/" className="hover:underline">Home</Link>
        <Link to="/datasets" className="hover:underline">Datasets</Link>
        <Link to="/dashboard" className="hover:underline">Dashboard</Link>
        <Link to="/contests" className="hover:underline">Contests</Link>

        {isLoggedIn ? (
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
          >
            Logout
          </button>
        ) : (
          <>
            <Link
              to="/login"
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
            >
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default TopNavigationBar;
