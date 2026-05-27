import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useFavorites } from '../hooks/useFavorites';
import { db } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import ListingGrid from '../components/ListingGrid';

const Favorites = () => {
  const { t } = useLanguage();
  const { favorites } = useFavorites();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      setLoading(true);
      try {
        if (favorites.length === 0) {
          setListings([]);
          setLoading(false);
          return;
        }

        const results = [];
        // Fetch each favorite listing from Firestore
        for (const id of favorites) {
          const docRef = doc(db, 'listings', id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists() && docSnap.data().status === 'active') {
            results.push({ id: docSnap.id, ...docSnap.data() });
          }
        }
        
        setListings(results);
      } catch (error) {
        console.error("Error fetching favorites:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [favorites]);

  return (
    <div className="container" style={{ padding: '40px 0', minHeight: 'calc(100vh - 200px)' }}>
      <h1 style={{ marginBottom: '24px' }}>{t('nav.favorites') || 'Mes Favoris'}</h1>
      
      {loading ? (
        <ListingGrid loading={true} />
      ) : listings.length > 0 ? (
        <ListingGrid listings={listings} loading={false} />
      ) : (
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>❤️</div>
          <h3 style={{ color: '#374151', marginBottom: '8px' }}>Vous n'avez pas encore de favoris</h3>
          <p style={{ color: '#6B7280' }}>Cliquez sur le cœur d'une annonce pour la sauvegarder ici.</p>
        </div>
      )}
    </div>
  );
};

export default Favorites;
