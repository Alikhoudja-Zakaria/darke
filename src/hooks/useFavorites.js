import { useState, useEffect } from 'react';

const FAV_KEY = 'darkoum_favorites';

export const useFavorites = () => {
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem(FAV_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const toggleFavorite = (id) => {
    if (!id) return;
    
    setFavorites(prev => {
      let updated;
      if (prev.includes(id)) {
        updated = prev.filter(item => item !== id);
      } else {
        updated = [...prev, id];
      }
      
      try {
        localStorage.setItem(FAV_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error("Could not save to localStorage", e);
      }
      
      return updated;
    });
  };

  const isFavorite = (id) => {
    return favorites.includes(id);
  };

  return { favorites, toggleFavorite, isFavorite };
};
