import axios from 'axios';
import { API_BASE_URL } from '../config';

const API_URL = `${API_BASE_URL}/api/orders`;

// Helper to get headers with token
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (token) {
        return { Authorization: `Bearer ${token}` };
    }

    const user = JSON.parse(localStorage.getItem('user'));
    return user?.token ? { Authorization: `Bearer ${user.token}` } : {};
};

// Create a new order
export const placeOrder = async (orderData) => {
    try {
        const response = await axios.post(API_URL, orderData);
        return { ...response.data, id: response.data._id };
    } catch (error) {
        console.error('Error placing order:', error);
        throw error;
    }
};

// Fetch all orders (Admin only)
export const fetchOrders = async () => {
    try {
        const response = await axios.get(API_URL, {
            headers: getAuthHeaders()
        });
        return response.data.map(o => ({ ...o, id: o._id }));
    } catch (error) {
        console.error('Error fetching orders:', error);
        throw error;
    }
};

export const fetchMyOrders = async () => {
    try {
        const response = await axios.get(`${API_URL}/my`, {
            headers: getAuthHeaders()
        });
        return response.data.map(o => ({ ...o, id: o._id }));
    } catch (error) {
        console.error('Error fetching my orders:', error);
        throw error;
    }
};

export const fetchOrderById = async (orderId) => {
    try {
        const response = await axios.get(`${API_URL}/${orderId}`, {
            headers: getAuthHeaders()
        });
        return { ...response.data, id: response.data._id };
    } catch (error) {
        console.error('Error fetching order details:', error);
        throw error;
    }
};

// Update order status (Admin / Delivery Partner)
export const updateOrderStatus = async (orderId, status) => {
    try {
        const response = await axios.put(`${API_URL}/${orderId}/status`, { status }, {
            headers: getAuthHeaders()
        });
        return { ...response.data, id: response.data._id };
    } catch (error) {
        console.error('Error updating order status:', error);
        throw error;
    }
};

// Assign order to delivery partner
export const assignOrder = async (orderId, deliveryPartnerId) => {
    try {
        const response = await axios.put(`${API_URL}/${orderId}/assign`, { deliveryPartnerId }, {
            headers: getAuthHeaders()
        });
        return { ...response.data, id: response.data._id };
    } catch (error) {
        console.error('Error assigning order:', error);
        throw error;
    }
};

// Fetch assigned tasks (Delivery Partner only)
export const fetchMyTasks = async () => {
    try {
        const response = await axios.get(`${API_URL}/my/tasks`, {
            headers: getAuthHeaders()
        });
        return response.data.map(o => ({ ...o, id: o._id }));
    } catch (error) {
        console.error('Error fetching partner tasks:', error);
        throw error;
    }
};
