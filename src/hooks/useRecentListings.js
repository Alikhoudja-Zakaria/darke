import { useState, useEffect, useCallback } from 'react';

const RECENT_KEY = 'darkoum_recent_listings';
const RECENT_EVENT = 'darkoum_recent_updated';
const MAX_RECENT = 6;

const getStoredRecents = () => {
  try {
    const saved = localStorage.getItem(RECENT_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (err) {
    console.error('Could not read recent listings from localStorage', err);
    return [];
  }
};

export const useRecentListings = () => {
  const [recentIds, setRecentIds] = useState(getStoredRecents);

  useEffect(() => {
    const handleUpdate = () => {
      setRecentIds(getStoredRecents());
    };

    window.addEventListener(RECENT_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener(RECENT_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const addRecentListing = useCallback((id) => {
    if (!id) return;
    const current = getStoredRecents();
    const filtered = current.filter(item => item !== id);
    const updated = [id, ...filtered].slice(0, MAX_RECENT);

    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('Could not save recent listings to localStorage', err);
    }

    setRecentIds(updated);
    window.dispatchEvent(new Event(RECENT_EVENT));
  }, []);

  const clearRecent = useCallback(() => {
    try {
      localStorage.removeItem(RECENT_KEY);
    } catch (err) {
      console.error('Could not clear recent listings in localStorage', err);
    }
    setRecentIds([]);
    window.dispatchEvent(new Event(RECENT_EVENT));
  }, []);

  return { recentIds, addRecentListing, clearRecent };
};
