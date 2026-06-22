import axios from 'axios';
import { API_BASE_URL } from '../config';

const API_URL = `${API_BASE_URL}/api/support`;

export const submitSupportRequest = async (payload) => {
  try {
    const response = await axios.post(`${API_URL}/contact`, payload, { withCredentials: true });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to submit support request.');
  }
};
