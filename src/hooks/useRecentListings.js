import { useState, useEffect } from 'react';

const RECENT_KEY = 'darkoum_recent_listings';
const MAX_RECENT = 6;

export const useRecentListings = () => {
  const [recentIds, setRecentIds] = useState(() => {
    try {
      const saved = localStorage.getItem(RECENT_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const addRecentListing = (id) => {
    if (!id) return;
    
    setRecentIds(prev => {
      // Remove if already exists to push it to the top
      const filtered = prev.filter(item => item !== id);
      const updated = [id, ...filtered].slice(0, MAX_RECENT);
      
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error("Could not save to localStorage", e);
      }
      
      return updated;
    });
  };

  const clearRecent = () => {
    setRecentIds([]);
    localStorage.removeItem(RECENT_KEY);
  };

  return { recentIds, addRecentListing, clearRecent };
};
