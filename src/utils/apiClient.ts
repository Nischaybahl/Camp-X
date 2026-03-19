const BACKEND_URL = import.meta.env.VITE_API_URL || 'https://camp-x.onrender.com/api';

/**
 * Generic API client that either fetches from the backend
 * or falls back to localStorage if backend is down.
 */

// Basic interface
export interface BaseItem {
    id: string;
    [key: string]: any;
}

export async function fetchItems<T>(type: string, fallbackStorageKey: string): Promise<T[]> {
    try {
        const response = await fetch(`${BACKEND_URL}/items/${type}`);
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
    } catch (e) {
        console.warn(`Backend not available for ${type}. Using localStorage.`);
        const stored = localStorage.getItem(fallbackStorageKey);
        return stored ? JSON.parse(stored) : [];
    }
}

export async function createItem<T extends BaseItem>(type: string, item: T, fallbackStorageKey: string, currentItems: T[]): Promise<boolean> {
    try {
        const response = await fetch(`${BACKEND_URL}/items/${type}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item)
        });
        if (!response.ok) throw new Error('Failed to create');
        return true;
    } catch (e) {
        console.warn(`Backend not available for ${type}. Falling back to localStorage.`);
        localStorage.setItem(fallbackStorageKey, JSON.stringify([item, ...currentItems]));
        return false;
    }
}

export async function updateItem<T extends BaseItem>(type: string, id: string, item: T, fallbackStorageKey: string, currentItems: T[]): Promise<boolean> {
    try {
        const response = await fetch(`${BACKEND_URL}/items/${type}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item)
        });
        if (!response.ok) throw new Error('Failed to update');
        return true;
    } catch (e) {
        console.warn(`Backend not available for ${type}. Falling back to localStorage.`);
        localStorage.setItem(fallbackStorageKey, JSON.stringify(currentItems.map(i => i.id === id ? item : i)));
        return false;
    }
}

export async function deleteItem<T extends BaseItem>(type: string, id: string, fallbackStorageKey: string, currentItems: T[]): Promise<boolean> {
    try {
        const response = await fetch(`${BACKEND_URL}/items/${type}/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete');
        return true;
    } catch (e) {
        console.warn(`Backend not available for ${type}. Falling back to localStorage.`);
        localStorage.setItem(fallbackStorageKey, JSON.stringify(currentItems.filter(i => i.id !== id)));
        return false;
    }
}
