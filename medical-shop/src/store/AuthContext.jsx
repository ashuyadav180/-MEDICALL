import React, { useState, createContext, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

// Synchronous function to read local storage instantly
const retrieveStoredData = () => {
    try {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        
        return { 
            token: storedToken, 
            user: storedUser ? JSON.parse(storedUser) : null 
        };
    } catch (err) {
        console.error("Failed to parse stored user data:", err);
        return { token: null, user: null };
    }
};

const data = retrieveStoredData(); 

export const AuthContext = createContext({
    isLoggedIn: !!data.token, 
    token: data.token,
    user: data.user,
    login: (token, userData) => {},
    logout: () => {},
});

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(data.token);
    const [user, setUser] = useState(data.user);

    const userIsLoggedIn = !!token; 

    const loginHandler = (newToken, userData) => {
        setToken(newToken);
        setUser(userData);
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(userData));
    };

    const logoutHandler = async () => {
        try {
            await axios.post(`${API_BASE_URL}/api/auth/logout`, {}, {
                withCredentials: true
            });
        } catch (err) {
            console.error("Logout error", err);
        }
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    };

    // --- REFRESH TOKEN LOGIC ---
    useEffect(() => {
        const refreshToken = async () => {
            try {
                // Backend will check the HttpOnly cookie
                const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {}, {
                    withCredentials: true // Important for cookies
                });
                const newToken = response.data.token;
                setToken(newToken);
                localStorage.setItem('token', newToken);
            } catch (err) {
                console.log("No valid refresh token found.");
                // If refresh fails, we might want to log the user out
                // logoutHandler();
            }
        };

        if (userIsLoggedIn) {
            // Refresh every 14 minutes (Access token expires in 15m)
            const interval = setInterval(refreshToken, 14 * 60 * 1000);
            return () => clearInterval(interval);
        }
    }, [userIsLoggedIn]);

    const contextValue = {
        isLoggedIn: userIsLoggedIn,
        token: token,
        user: user,
        login: loginHandler,
        logout: logoutHandler,
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => React.useContext(AuthContext); 
