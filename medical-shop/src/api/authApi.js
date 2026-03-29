import axios from 'axios';
import { API_BASE_URL } from '../config';

const API_URL = `${API_BASE_URL}/api/auth`;
const credentialConfig = { withCredentials: true };

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (token) {
        return { Authorization: `Bearer ${token}` };
    }

    const storedUser = JSON.parse(localStorage.getItem('user'));
    return storedUser?.token ? { Authorization: `Bearer ${storedUser.token}` } : {};
};

export const loginUser = async ({ identifier, password }) => {
    try {
        const response = await axios.post(`${API_URL}/login`, { identifier, password }, credentialConfig);
        return {
            token: response.data.token,
            user: response.data,
        };
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Login failed.');
    }
};

export const registerUser = async ({ email, name, mobile, password }) => {
    try {
        const response = await axios.post(
            `${API_URL}/register`,
            { email, name, mobile, password },
            credentialConfig
        );
        return {
            token: response.data.token,
            user: response.data,
        };
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Registration failed.');
    }
};

export const sendOTP = async (identifier) => {
    try {
        const response = await axios.post(`${API_URL}/send-otp`, { identifier }, credentialConfig);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to send OTP.');
    }
};

export const verifyOTP = async ({ identifier, otp, profile }) => {
    try {
        const response = await axios.post(`${API_URL}/verify-otp`, { identifier, otp, profile }, credentialConfig);
        return {
            token: response.data.token,
            user: response.data,
        };
    } catch (error) {
        throw new Error(error.response?.data?.message || 'OTP verification failed.');
    }
};

export const requestPasswordReset = async (email) => {
    try {
        const response = await axios.post(`${API_URL}/forgot-password`, { email }, credentialConfig);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to send password reset OTP.');
    }
};

export const resetPassword = async ({ email, otp, password }) => {
    try {
        const response = await axios.post(`${API_URL}/reset-password`, { email, otp, password }, credentialConfig);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to reset password.');
    }
};

export const fetchProfile = async () => {
    try {
        const response = await axios.get(`${API_URL}/profile`, {
            headers: getAuthHeaders(),
            withCredentials: true,
        });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to fetch profile.');
    }
};

export const updateProfile = async ({ name, email, phone, password }) => {
    try {
        const response = await axios.put(
            `${API_URL}/profile`,
            { name, email, phone, password },
            {
                headers: getAuthHeaders(),
                withCredentials: true,
            }
        );
        return {
            token: response.data.token,
            user: response.data,
        };
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to update profile.');
    }
};

export const fetchDeliveryPartners = async () => {
    try {
        const response = await axios.get(`${API_URL}/partners`, {
            headers: getAuthHeaders(),
            withCredentials: true,
        });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to fetch partners.');
    }
};
