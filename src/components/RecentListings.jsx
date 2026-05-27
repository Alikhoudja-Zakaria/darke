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
          gap: '16px', 
          overflowX: 'auto', 
          paddingBottom: '16px',
          scrollSnapType: 'x mandatory',
          margin: '0 -16px',
          padding: '0 16px'
        }}
      >
        {recentListings.map(listing => (
          <div key={listing.id} className="recent-card-wrapper">
            <PropertyCard listing={listing} />
          </div>
        ))}
      </div>
      
      <style>{`
        .recent-grid::-webkit-scrollbar {
          height: 8px;
        }
        .recent-grid::-webkit-scrollbar-track {
          background: transparent;
        }
        .recent-grid::-webkit-scrollbar-thumb {
          background: #D1D5DB;
          border-radius: 4px;
        }
        .recent-card-wrapper {
          min-width: 220px;
          max-width: 240px;
          scroll-snap-align: start;
        }
        .recent-card-wrapper .carousel-container {
          height: 160px;
        }
        .recent-card-wrapper .card-content {
          padding: 10px;
        }
        .recent-card-wrapper .card-title {
          font-size: 1rem !important;
          margin-bottom: 4px !important;
        }
        .recent-card-wrapper .card-price {
          font-size: 0.95rem !important;
          margin-bottom: 8px !important;
        }
        .recent-card-wrapper .card-specs {
          font-size: 0.8rem;
          gap: 4px;
        }

        @media (max-width: 768px) {
          .recent-card-wrapper {
            min-width: 200px;
            max-width: 200px;
          }
          .recent-card-wrapper .carousel-container {
            height: 140px; 
          }
        }
      `}</style>
    </div>
  );
};

export default RecentListings;
