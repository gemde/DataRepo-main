import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Load user and token from localStorage on app start
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
            try {
                setUser(JSON.parse(storedUser));
                setToken(storedToken);
            } catch (error) {
                console.error("Failed to parse stored user data:", error);
                // Clear invalid data
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        }
        setLoading(false); // Finished initial loading
    }, []);

    const login = (token, userData) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setToken(token);
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
    };

    // NEW FUNCTION: To update only the profile picture URL in context and localStorage
    const updateProfilePicture = (newUrl) => {
        setUser(prevUser => {
            if (prevUser) {
                const updatedUser = { ...prevUser, profile_picture_url: newUrl };
                localStorage.setItem('user', JSON.stringify(updatedUser)); // Update localStorage too
                return updatedUser;
            }
            return prevUser;
        });
    };

    const authContextValue = {
        user,
        token,
        loading,
        login,
        logout,
        isAuthenticated: !!token, // Convenience checker
        updateProfilePicture // Expose the new function
    };

    return (
        <AuthContext.Provider value={authContextValue}>
            {children}
        </AuthContext.Provider>
    );
};