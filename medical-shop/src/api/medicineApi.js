import axios from 'axios';
import { API_BASE_URL } from '../config';

const API_URL = `${API_BASE_URL}/api/medicines`;

// Helper to get headers with token
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (token) {
        return { Authorization: `Bearer ${token}` };
    }

    const user = JSON.parse(localStorage.getItem('user'));
    return user?.token ? { Authorization: `Bearer ${user.token}` } : {};
};

// Fetch all medicines
export const fetchMedicines = async () => {
    try {
        const response = await axios.get(API_URL);
        // Map _id to id for frontend compatibility
        return response.data.map(m => ({ ...m, id: m._id }));
    } catch (error) {
        console.error('Error fetching medicines:', error);
        throw error;
    }
};

// Fetch single medicine by ID
export const fetchMedicineById = async (id) => {
    try {
        const response = await axios.get(`${API_URL}/${id}`);
        return { ...response.data, id: response.data._id };
    } catch (error) {
        console.error('Error fetching medicine by ID:', error);
        throw error;
    }
};

// Add a new medicine (Admin only)
export const addMedicine = async (newMedicine) => {
    try {
        const response = await axios.post(API_URL, newMedicine, {
            headers: getAuthHeaders()
        });
        return { ...response.data, id: response.data._id };
    } catch (error) {
        console.error('Error adding medicine:', error);
        throw error;
    }
};

// Update an existing medicine (Admin only)
export const updateMedicine = async (updatedMedicine) => {
    try {
        const response = await axios.put(`${API_URL}/${updatedMedicine.id}`, updatedMedicine, {
            headers: getAuthHeaders()
        });
        return { ...response.data, id: response.data._id };
    } catch (error) {
        console.error('Error updating medicine:', error);
        throw error;
    }
};

// Delete a medicine (Admin only)
export const deleteMedicine = async (id) => {
    try {
        const response = await axios.delete(`${API_URL}/${id}`, {
            headers: getAuthHeaders()
        });
        return { success: true, id };
    } catch (error) {
        console.error('Error deleting medicine:', error);
        throw error;
    }
};
