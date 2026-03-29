import axios from 'axios';
import { auth, firebase, FIREBASE_IS_CONFIGURED } from '../firebase';
import { API_BASE_URL } from '../config';

const API_URL = `${API_BASE_URL}/api/auth`;
let confirmationResult = null;

const formatPhoneNumber = (phone) => {
    const digits = phone.replace(/\D/g, '');
    return digits.startsWith('91') && digits.length === 12 ? `+${digits}` : `+91${digits}`;
};

const ensureRecaptchaContainer = () => {
    let container = document.getElementById('firebase-recaptcha-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'firebase-recaptcha-container';
        container.style.position = 'fixed';
        container.style.left = '-9999px';
        container.style.top = '-9999px';
        document.body.appendChild(container);
    }
    return container.id;
};

const getRecaptchaVerifier = () => {
    if (!FIREBASE_IS_CONFIGURED || !auth) {
        return null;
    }

    if (!window.recaptchaVerifier) {
        const containerId = ensureRecaptchaContainer();
        window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier(containerId, {
            size: 'invisible',
        });
    }

    return window.recaptchaVerifier;
};

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (token) {
        return { Authorization: `Bearer ${token}` };
    }

    const storedUser = JSON.parse(localStorage.getItem('user'));
    return storedUser?.token ? { Authorization: `Bearer ${storedUser.token}` } : {};
};

/**
 * Login using email and password.
 */
export const loginUser = async ({ email, password }) => {
    try {
        const response = await axios.post(`${API_URL}/login`, { email, password });
        return {
            token: response.data.token,
            user: response.data, 
        };
    } catch (error) {
        throw new Error(error.response?.data?.message || "Login failed.");
    }
};

/**
 * Register a new user.
 */
export const registerUser = async ({ email, name, mobile, password }) => {
    try {
        const response = await axios.post(`${API_URL}/register`, { email, name, mobile, password });
        return {
            token: response.data.token,
            user: response.data,
        };
    } catch (error) {
        throw new Error(error.response?.data?.message || "Registration failed.");
    }
};

/**
 * Send OTP to mobile phone.
 */
export const sendOTP = async (phone) => {
    if (FIREBASE_IS_CONFIGURED && auth) {
        try {
            const appVerifier = getRecaptchaVerifier();
            confirmationResult = await auth.signInWithPhoneNumber(formatPhoneNumber(phone), appVerifier);
            return { provider: 'firebase' };
        } catch (error) {
            throw new Error(error.message || 'Failed to send Firebase OTP.');
        }
    }

    try {
        const response = await axios.post(`${API_URL}/send-otp`, { phone });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || "Failed to send OTP.");
    }
};

/**
 * Verify OTP and login.
 */
export const verifyOTP = async ({ phone, otp, profile }) => {
    if (FIREBASE_IS_CONFIGURED && auth) {
        try {
            if (!confirmationResult) {
                throw new Error('Please request a new OTP and try again.');
            }

            const firebaseUser = await confirmationResult.confirm(otp);
            const idToken = await firebaseUser.user.getIdToken();
            confirmationResult = null;

            const response = await axios.post(`${API_URL}/firebase-phone`, {
                idToken,
                profile,
            });

            return {
                token: response.data.token,
                user: response.data,
            };
        } catch (error) {
            throw new Error(error.response?.data?.message || error.message || 'Firebase OTP verification failed.');
        }
    }

    try {
        const response = await axios.post(`${API_URL}/verify-otp`, { phone, otp });
        return {
            token: response.data.token,
            user: response.data,
        };
    } catch (error) {
        throw new Error(error.response?.data?.message || "OTP verification failed.");
    }
};

export const isFirebasePhoneAuthEnabled = () => FIREBASE_IS_CONFIGURED;

/**
 * Fetch all delivery partners (Admin only).
 */
export const fetchDeliveryPartners = async () => {
    try {
        const response = await axios.get(`${API_URL}/partners`, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || "Failed to fetch partners.");
    }
};
