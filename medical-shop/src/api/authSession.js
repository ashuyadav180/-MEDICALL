import axios from 'axios';
import { API_BASE_URL } from '../config';

const AUTH_API_URL = `${API_BASE_URL}/api/auth`;
const credentialConfig = { withCredentials: true };

const readStoredUser = () => {
    try {
        const rawUser = localStorage.getItem('user');
        return rawUser ? JSON.parse(rawUser) : null;
    } catch (error) {
        console.error('Failed to parse stored user data:', error);
        return null;
    }
};

export const getStoredAuth = () => ({
    token: localStorage.getItem('token'),
    user: readStoredUser(),
});

export const persistAuth = (token, user) => {
    if (token) {
        localStorage.setItem('token', token);
    } else {
        localStorage.removeItem('token');
    }

    if (user) {
        localStorage.setItem('user', JSON.stringify({ ...user, token: token || user.token || null }));
    } else {
        localStorage.removeItem('user');
    }
};

export const clearStoredAuth = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
};

export const getAuthHeaders = () => {
    const { token, user } = getStoredAuth();

    if (token) {
        return { Authorization: `Bearer ${token}` };
    }

    return user?.token ? { Authorization: `Bearer ${user.token}` } : {};
};

const isRefreshableAuthError = (error) => {
    const status = error?.response?.status;
    const message = error?.response?.data?.message;

    return (
        status === 401 &&
        ['Not authorized, token failed', 'Not authorized, no token'].includes(message)
    );
};

export const refreshAccessToken = async () => {
    const response = await axios.post(`${AUTH_API_URL}/refresh`, {}, credentialConfig);
    const newToken = response.data?.token;

    if (newToken) {
        const { user } = getStoredAuth();
        persistAuth(newToken, user);
    }

    return newToken;
};

export const withAuthRetry = async (request) => {
    try {
        return await request(getAuthHeaders());
    } catch (error) {
        if (!isRefreshableAuthError(error)) {
            throw error;
        }

        const refreshedToken = await refreshAccessToken();

        if (!refreshedToken) {
            throw error;
        }

        return request(getAuthHeaders());
    }
};
