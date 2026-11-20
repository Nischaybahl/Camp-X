const BACKEND_URL = import.meta.env.VITE_API_URL || 'https://camp-x.onrender.com/api';

/**
 * Generic API client that fetches from backend with local storage caching.
 * Always writes to localStorage immediately (optimistic offline-first) so data is never lost.
 */

export interface BaseItem {
    id: string;
    trackingId?: string;
    [key: string]: unknown;
}

export async function fetchItems<T extends BaseItem>(type: string, fallbackStorageKey: string): Promise<T[]> {
    let localData: T[] = [];
    try {
        const stored = localStorage.getItem(fallbackStorageKey);
        if (stored) localData = JSON.parse(stored);
    } catch {
        localData = [];
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout for cold start
        const response = await fetch(`${BACKEND_URL}/items/${type}`, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) throw new Error('Network response was not ok');
        const remoteData = await response.json();

        // Merge remote + local so newly created items not yet synced aren't lost
        const map = new Map<string, T>();
        if (Array.isArray(remoteData)) {
            remoteData.forEach((item: T) => {
                const key = String(item.trackingId || item.id);
                map.set(key, item);
            });
        }
        localData.forEach((item: T) => {
            const key = String(item.trackingId || item.id);
            if (!map.has(key)) {
                map.set(key, item);
            }
        });

        const merged = Array.from(map.values());
        try {
            localStorage.setItem(fallbackStorageKey, JSON.stringify(merged));
        } catch {}
        return merged;
    } catch {
        console.warn(`Backend not available for ${type}. Using localStorage.`);
        return localData;
    }
}

export async function createItem<T extends BaseItem>(type: string, item: T, fallbackStorageKey: string, currentItems: T[]): Promise<boolean> {
    // 1. Immediately persist to localStorage for instant local availability
    try {
        const stored = localStorage.getItem(fallbackStorageKey);
        const list: T[] = stored ? JSON.parse(stored) : currentItems;
        const filtered = list.filter(i => {
            const sameId = i.id && item.id && String(i.id) === String(item.id);
            const sameTrack = i.trackingId && item.trackingId && String(i.trackingId) === String(item.trackingId);
            return !sameId && !sameTrack;
        });
        localStorage.setItem(fallbackStorageKey, JSON.stringify([item, ...filtered]));
    } catch (e) {
        console.warn('Error saving to localStorage in createItem:', e);
    }

    // 2. Sync to backend
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        const response = await fetch(`${BACKEND_URL}/items/${type}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item),
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (!response.ok) throw new Error('Failed to create on backend');
        return true;
    } catch {
        console.warn(`Backend not available for ${type}. Successfully saved locally.`);
        return false;
    }
}

export async function updateItem<T extends BaseItem>(type: string, id: string, item: T, fallbackStorageKey: string, currentItems: T[]): Promise<boolean> {
    try {
        const stored = localStorage.getItem(fallbackStorageKey);
        const list: T[] = stored ? JSON.parse(stored) : currentItems;
        const updated = list.map(i => (
            String(i.id) === String(id) || (i.trackingId && item.trackingId && String(i.trackingId) === String(item.trackingId))
                ? item
                : i
        ));
        localStorage.setItem(fallbackStorageKey, JSON.stringify(updated));
    } catch (e) {
        console.warn('Error updating localStorage:', e);
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        const response = await fetch(`${BACKEND_URL}/items/${type}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item),
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (!response.ok) throw new Error('Failed to update on backend');
        return true;
    } catch {
        console.warn(`Backend not available for ${type}. Updated locally.`);
        return false;
    }
}

export async function deleteItem<T extends BaseItem>(type: string, id: string, fallbackStorageKey: string, currentItems: T[]): Promise<boolean> {
    try {
        const stored = localStorage.getItem(fallbackStorageKey);
        const list: T[] = stored ? JSON.parse(stored) : currentItems;
        const filtered = list.filter(i => String(i.id) !== String(id) && (!i.trackingId || String(i.trackingId) !== String(id)));
        localStorage.setItem(fallbackStorageKey, JSON.stringify(filtered));
    } catch (e) {
        console.warn('Error deleting from localStorage:', e);
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        const response = await fetch(`${BACKEND_URL}/items/${type}/${id}`, {
            method: 'DELETE',
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (!response.ok) throw new Error('Failed to delete on backend');
        return true;
    } catch {
        console.warn(`Backend not available for ${type}. Deleted locally.`);
        return false;
    }
}
