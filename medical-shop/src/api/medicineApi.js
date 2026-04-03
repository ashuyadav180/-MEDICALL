import axios from 'axios';
import { API_BASE_URL } from '../config';
import { withAuthRetry } from './authSession';

const API_URL = `${API_BASE_URL}/api/medicines`;
const MEDICINES_CACHE_KEY = 'medicines_cache_v1';
const MEDICINE_CACHE_PREFIX = 'medicine_cache_v1:';
const CACHE_TTL_MS = 5 * 60 * 1000;
let medicinesMemoryCache = null;
const medicineMemoryCache = new Map();

const canUseStorage = typeof window !== 'undefined' && window.sessionStorage;

const readCache = (key) => {
    if (!canUseStorage) {
        return null;
    }

    try {
        const rawValue = window.sessionStorage.getItem(key);
        if (!rawValue) {
            return null;
        }

        const parsedValue = JSON.parse(rawValue);
        if (!parsedValue?.timestamp || Date.now() - parsedValue.timestamp > CACHE_TTL_MS) {
            window.sessionStorage.removeItem(key);
            return null;
        }

        return parsedValue.data ?? null;
    } catch {
        return null;
    }
};

const writeCache = (key, data) => {
    if (!canUseStorage) {
        return;
    }

    try {
        window.sessionStorage.setItem(
            key,
            JSON.stringify({
                timestamp: Date.now(),
                data,
            })
        );
    } catch {
        // Ignore cache write failures so the network request still succeeds.
    }
};

const normalizeMedicine = (medicine) => ({ ...medicine, id: medicine._id || medicine.id });

const cacheMedicineList = (medicines) => {
    medicinesMemoryCache = medicines;
    writeCache(MEDICINES_CACHE_KEY, medicines);

    medicines.forEach((medicine) => {
        medicineMemoryCache.set(medicine.id, medicine);
        writeCache(`${MEDICINE_CACHE_PREFIX}${medicine.id}`, medicine);
    });
};

const syncMedicineListCache = (medicine, mode = 'upsert') => {
    if (!medicinesMemoryCache) {
        return;
    }

    if (mode === 'remove') {
        medicinesMemoryCache = medicinesMemoryCache.filter((item) => item.id !== medicine.id);
    } else {
        const existingIndex = medicinesMemoryCache.findIndex((item) => item.id === medicine.id);
        if (existingIndex === -1) {
            medicinesMemoryCache = [...medicinesMemoryCache, medicine];
        } else {
            medicinesMemoryCache = medicinesMemoryCache.map((item) => (
                item.id === medicine.id ? medicine : item
            ));
        }
    }

    medicinesMemoryCache = [...medicinesMemoryCache].sort((a, b) => a.name.localeCompare(b.name));
    writeCache(MEDICINES_CACHE_KEY, medicinesMemoryCache);
};

export const getCachedMedicineById = (id) => {
    if (!id) {
        return null;
    }

    return medicineMemoryCache.get(id) || readCache(`${MEDICINE_CACHE_PREFIX}${id}`) || null;
};

export const getCachedMedicines = () => {
    const cachedMedicines = medicinesMemoryCache || readCache(MEDICINES_CACHE_KEY);
    if (cachedMedicines?.length) {
        medicinesMemoryCache = cachedMedicines;
        cachedMedicines.forEach((medicine) => {
            medicineMemoryCache.set(medicine.id, medicine);
        });
        return cachedMedicines;
    }

    return [];
};

export const primeMedicineCache = (medicine) => {
    if (!medicine?.id) {
        return;
    }

    medicineMemoryCache.set(medicine.id, medicine);
    writeCache(`${MEDICINE_CACHE_PREFIX}${medicine.id}`, medicine);
};

// Fetch all medicines
export const fetchMedicines = async (options = {}) => {
    const { forceRefresh = false } = options;
    const cachedMedicines = getCachedMedicines();
    if (!forceRefresh && cachedMedicines.length) {
        return cachedMedicines;
    }

    try {
        const response = await axios.get(API_URL);
        const medicines = response.data.map(normalizeMedicine);
        cacheMedicineList(medicines);
        return medicines;
    } catch (error) {
        console.error('Error fetching medicines:', error);
        throw error;
    }
};

// Fetch single medicine by ID
export const fetchMedicineById = async (id) => {
    const cachedMedicine = getCachedMedicineById(id);
    if (cachedMedicine) {
        return cachedMedicine;
    }

    try {
        const response = await axios.get(`${API_URL}/${id}`);
        const medicine = normalizeMedicine(response.data);
        primeMedicineCache(medicine);
        return medicine;
    } catch (error) {
        console.error('Error fetching medicine by ID:', error);
        throw error;
    }
};

// Add a new medicine (Admin only)
export const addMedicine = async (medicineData) => {
    try {
        const response = await withAuthRetry((headers) => axios.post(API_URL, medicineData, {
            headers,
        }));
        const medicine = normalizeMedicine(response.data);
        primeMedicineCache(medicine);
        syncMedicineListCache(medicine);
        return medicine;
    } catch (error) {
        console.error('Error adding medicine:', error);
        throw error;
    }
};

// Update an existing medicine (Admin only)
export const updateMedicine = async (id, medicineData) => {
    try {
        const response = await withAuthRetry((headers) => axios.put(`${API_URL}/${id}`, medicineData, {
            headers,
        }));
        const medicine = normalizeMedicine(response.data);
        primeMedicineCache(medicine);
        syncMedicineListCache(medicine);
        return medicine;
    } catch (error) {
        console.error('Error updating medicine:', error);
        throw error;
    }
};

// Delete a medicine (Admin only)
export const deleteMedicine = async (id) => {
    try {
        await withAuthRetry((headers) => axios.delete(`${API_URL}/${id}`, {
            headers,
        }));
        medicineMemoryCache.delete(id);
        if (canUseStorage) {
            window.sessionStorage.removeItem(`${MEDICINE_CACHE_PREFIX}${id}`);
        }
        syncMedicineListCache({ id }, 'remove');
        return { success: true, id };
    } catch (error) {
        console.error('Error deleting medicine:', error);
        throw error;
    }
};
