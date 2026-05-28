import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useFavorites } from '../hooks/useFavorites';
import { useRecentListings } from '../hooks/useRecentListings';
import { db } from '../firebase/config';
import { collection, getDocs, query, where, documentId } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { FiHeart, FiSearch, FiClock } from 'react-icons/fi';
import ListingGrid from '../components/ListingGrid';
import './Favorites.css';

const Favorites = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { favorites } = useFavorites();
  const { recentIds } = useRecentListings();
  
  const [favoriteListings, setFavoriteListings] = useState([]);
  const [recentListings, setRecentListings] = useState([]);
  const [loadingFavorites, setLoadingFavorites] = useState(true);
  const [loadingRecent, setLoadingRecent] = useState(true);

  // Fetch helper for arrays of IDs
  const fetchListingsByIds = async (idsArray) => {
    if (!idsArray || idsArray.length === 0) return [];
    
    try {
      const resultsMap = new Map();
      const chunkSize = 30; // Firestore limit
      
      for (let i = 0; i < idsArray.length; i += chunkSize) {
        const chunk = idsArray.slice(i, i + chunkSize);
        const q = query(
          collection(db, 'listings'),
          where(documentId(), 'in', chunk),
          where('status', '==', 'active')
        );
        const snapshot = await getDocs(q);
        snapshot.forEach(docSnap => {
          resultsMap.set(docSnap.id, { id: docSnap.id, ...docSnap.data() });
        });
      }
      
      // Return in the exact order of the provided array
      return idsArray
        .map(id => resultsMap.get(id))
        .filter(Boolean);
    } catch (error) {
      console.error("Error fetching listings:", error);
      return [];
    }
  };

  useEffect(() => {
    const loadFavorites = async () => {
      setLoadingFavorites(true);
      const results = await fetchListingsByIds(favorites);
      setFavoriteListings(results);
      setLoadingFavorites(false);
    };
    loadFavorites();
  }, [favorites]); // Re-run when favorites change

  useEffect(() => {
    const loadRecent = async () => {
      setLoadingRecent(true);
      // Filter out recent IDs that are already in favorites to avoid duplication
      const uniqueRecentIds = (recentIds || []).filter(id => !favorites.includes(id));
      const results = await fetchListingsByIds(uniqueRecentIds);
      setRecentListings(results);
      setLoadingRecent(false);
    };
    loadRecent();
  }, [recentIds, favorites]); // Re-run to keep filtered list updated

  return (
    <div className="favorites-page">
      <div className="container">
        <div className="favorites-header">
          <h1>{t('nav.favorites') || 'Favoris'}</h1>
          <p>{t('misc.favorites_subtitle') || 'Retrouvez facilement les annonces qui vous intéressent'}</p>
        </div>
        
        {/* FAVORITES SECTION */}
        <div className="favorites-section">
          <h2 className="favorites-section-title">
            <FiHeart style={{ color: 'var(--error-color)', fill: 'var(--error-color)' }} /> 
            {t('misc.saved_listings') || 'Annonces sauvegardées'}
          </h2>
          
          {loadingFavorites ? (
            <ListingGrid loading={true} />
          ) : favoriteListings.length > 0 ? (
            <ListingGrid listings={favoriteListings} loading={false} />
          ) : (
            <div className="favorites-empty">
              <div className="favorites-empty-icon">
                <FiHeart size={48} color="var(--border-color)" />
              </div>
              <h3 className="favorites-empty-title">{t('misc.no_favorites_title') || "Vous n'avez pas encore de favoris"}</h3>
              <p className="favorites-empty-desc">
                {t('misc.no_favorites_desc') || "Cliquez sur le cœur d'une annonce pour la sauvegarder ici."}
              </p>
              <button 
                className="btn-primary btn-large" 
                style={{ width: 'auto', padding: '12px 24px' }}
                onClick={() => navigate('/')}
              >
                <FiSearch size={20} /> {t('nav.search') || 'Rechercher des annonces'}
              </button>
            </div>
          )}
        </div>

        {/* RECENTLY VIEWED SECTION */}
        {recentListings.length > 0 && !loadingRecent && (
          <div className="favorites-section">
            <h2 className="favorites-section-title" style={{ marginTop: '48px' }}>
              <FiClock style={{ color: 'var(--primary-color)' }} /> 
              {t('home.recently_viewed') || 'Annonces vues récemment'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '1rem' }}>
              {t('misc.recent_desc') || 'Vous avez consulté ces annonces. N\'hésitez pas à les sauvegarder.'}
            </p>
            
            <ListingGrid listings={recentListings} loading={false} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites;
