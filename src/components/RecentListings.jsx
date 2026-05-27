import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useRecentListings } from '../hooks/useRecentListings';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import PropertyCard from './PropertyCard';

const RecentListings = () => {
  const { t } = useLanguage();
  const { recentIds } = useRecentListings();
  const [recentListings, setRecentListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecent = async () => {
      if (!recentIds || recentIds.length === 0) {
        setRecentListings([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const results = [];
        for (const id of recentIds) {
          const docRef = doc(db, 'listings', id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists() && docSnap.data().status === 'active') {
            results.push({ id: docSnap.id, ...docSnap.data() });
          }
        }
        setRecentListings(results);
      } catch (error) {
        console.error("Error fetching recent listings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecent();
  }, [recentIds]);

  if (loading || recentListings.length === 0) {
    return null;
  }

  return (
    <div className="recent-listings" style={{ marginBottom: '40px' }}>
      <h2 style={{ marginBottom: '16px', fontSize: '1.5rem', color: '#111827' }}>
        {t('home.recently_viewed')}
      </h2>
      <div 
        className="recent-grid" 
        style={{ 
          display: 'flex', 
          gap: '24px', 
          overflowX: 'auto', 
          paddingBottom: '16px',
          scrollSnapType: 'x mandatory'
        }}
      >
        {recentListings.map(listing => (
          <div key={listing.id} style={{ minWidth: '300px', maxWidth: '350px', scrollSnapAlign: 'start' }}>
            <PropertyCard listing={listing} />
          </div>
        ))}
      </div>
      
      <style>{`
        .recent-grid::-webkit-scrollbar {
          height: 8px;
        }
        .recent-grid::-webkit-scrollbar-track {
          background: #F3F4F6;
          border-radius: 4px;
        }
        .recent-grid::-webkit-scrollbar-thumb {
          background: #D1D5DB;
          border-radius: 4px;
        }
        .recent-grid::-webkit-scrollbar-thumb:hover {
          background: #9CA3AF;
        }
      `}</style>
    </div>
  );
};

export default RecentListings;
