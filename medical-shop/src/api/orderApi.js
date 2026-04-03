import axios from 'axios';
import { API_BASE_URL } from '../config';
import { withAuthRetry } from './authSession';

const API_URL = `${API_BASE_URL}/api/orders`;
const normalizeOrder = (order) => ({
    ...order,
    id: order._id || order.id,
    reference: order.reference || order.orderNumber || order._id || order.id,
});

// Create a new order
export const placeOrder = async (orderData) => {
    try {
        const response = await withAuthRetry((headers) => axios.post(API_URL, orderData, {
            headers,
            withCredentials: true,
        }));
        return normalizeOrder(response.data);
    } catch (error) {
        console.error('Error placing order:', error);
        throw error;
    }
};

// Fetch all orders (Admin only)
export const fetchOrders = async () => {
    try {
        const response = await withAuthRetry((headers) => axios.get(API_URL, {
            headers,
        }));
        return response.data.map(normalizeOrder);
    } catch (error) {
        console.error('Error fetching orders:', error);
        throw error;
    }
};

export const fetchMyOrders = async () => {
    try {
        const response = await withAuthRetry((headers) => axios.get(`${API_URL}/my`, {
            headers,
        }));
        return response.data.map(normalizeOrder);
    } catch (error) {
        console.error('Error fetching my orders:', error);
        throw error;
    }
};

export const fetchOrderById = async (orderId) => {
    try {
        const response = await withAuthRetry((headers) => axios.get(`${API_URL}/${orderId}`, {
            headers,
        }));
        return normalizeOrder(response.data);
    } catch (error) {
        console.error('Error fetching order details:', error);
        throw error;
    }
};

export const fetchTrackOrder = async (reference) => {
    try {
        const response = await axios.get(`${API_URL}/track/${encodeURIComponent(reference)}`);
        return normalizeOrder(response.data);
    } catch (error) {
        console.error('Error fetching order details:', error);
        throw error;
    }
};

// Update order status (Admin / Delivery Partner)
export const updateOrderStatus = async (orderId, status) => {
    try {
        const response = await withAuthRetry((headers) => axios.put(`${API_URL}/${orderId}/status`, { status }, {
            headers,
        }));
        return normalizeOrder(response.data);
    } catch (error) {
        console.error('Error updating order status:', error);
        throw error;
    }
};

export const updateOrderPaymentStatus = async (orderId, paymentStatus) => {
    try {
        const response = await withAuthRetry((headers) => axios.put(`${API_URL}/${orderId}/payment-status`, { paymentStatus }, {
            headers,
        }));
        return normalizeOrder(response.data);
    } catch (error) {
        console.error('Error updating payment status:', error);
        throw error;
    }
};

// Assign order to delivery partner
export const assignOrder = async (orderId, deliveryPartnerId) => {
    try {
        const response = await withAuthRetry((headers) => axios.put(`${API_URL}/${orderId}/assign`, { deliveryPartnerId }, {
            headers,
        }));
        return normalizeOrder(response.data);
    } catch (error) {
        console.error('Error assigning order:', error);
        throw error;
    }
};

// Fetch assigned tasks (Delivery Partner only)
export const fetchMyTasks = async () => {
    try {
        const response = await withAuthRetry((headers) => axios.get(`${API_URL}/my/tasks`, {
            headers,
        }));
        return response.data.map(normalizeOrder);
    } catch (error) {
        console.error('Error fetching partner tasks:', error);
        throw error;
    }
};
