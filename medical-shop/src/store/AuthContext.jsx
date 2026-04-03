/* eslint-disable react-refresh/only-export-components */
import React, { useState, createContext, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { clearStoredAuth, getStoredAuth, persistAuth, refreshAccessToken } from '../api/authSession';

// Synchronous function to read local storage instantly
const retrieveStoredData = () => getStoredAuth();

const data = retrieveStoredData(); 

export const AuthContext = createContext({
    isLoggedIn: !!data.token, 
    token: data.token,
    user: data.user,
    login: () => {},
    logout: () => {},
});

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(data.token);
    const [user, setUser] = useState(data.user);

    const userIsLoggedIn = !!token; 

    const loginHandler = (newToken, userData) => {
        const nextUser = userData ? { ...userData, token: newToken } : null;
        setToken(newToken);
        setUser(nextUser);
        persistAuth(newToken, nextUser);
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
        clearStoredAuth();
    };

    // --- REFRESH TOKEN LOGIC ---
    useEffect(() => {
        if (!userIsLoggedIn) {
            return undefined;
        }

        let isActive = true;

        const syncAccessToken = async () => {
            try {
                const newToken = await refreshAccessToken();

                if (!isActive || !newToken) {
                    return;
                }

                setToken(newToken);
                setUser((currentUser) => (
                    currentUser ? { ...currentUser, token: newToken } : currentUser
                ));
            } catch {
                console.log("No valid refresh token found.");
            }
        };

        syncAccessToken();

        // Refresh every 14 minutes (Access token expires in 15m)
        const interval = setInterval(syncAccessToken, 14 * 60 * 1000);

        return () => {
            isActive = false;
            clearInterval(interval);
        };
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
