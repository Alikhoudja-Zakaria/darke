import { useState, useEffect, useCallback } from 'react';

const FAV_KEY = 'darkoum_favorites';
const FAV_EVENT = 'darkoum_favorites_updated';

const getStoredFavorites = () => {
  try {
    const saved = localStorage.getItem(FAV_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (err) {
    console.error('Could not read favorites from localStorage', err);
    return [];
  }
};

export const useFavorites = () => {
  const [favorites, setFavorites] = useState(getStoredFavorites);

  useEffect(() => {
    const handleUpdate = () => {
      setFavorites(getStoredFavorites());
    };

    window.addEventListener(FAV_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener(FAV_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const toggleFavorite = useCallback((id) => {
    if (!id) return;
    const current = getStoredFavorites();
    const updated = current.includes(id)
      ? current.filter(item => item !== id)
      : [...current, id];

    try {
      localStorage.setItem(FAV_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('Could not save favorites to localStorage', err);
    }

    setFavorites(updated);
    window.dispatchEvent(new Event(FAV_EVENT));
  }, []);

  const isFavorite = useCallback((id) => {
    return favorites.includes(id);
  }, [favorites]);

  return { favorites, toggleFavorite, isFavorite };
};
