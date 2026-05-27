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
          gap: '12px', 
          overflowX: 'auto', 
          paddingBottom: '16px',
          scrollSnapType: 'x mandatory'
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
          height: 6px;
        }
        .recent-grid::-webkit-scrollbar-track {
          background: transparent;
        }
        .recent-grid::-webkit-scrollbar-thumb {
          background: #E5E7EB;
          border-radius: 4px;
        }
        .recent-card-wrapper {
          min-width: 160px;
          max-width: 160px;
          scroll-snap-align: start;
        }
        .recent-card-wrapper .carousel-container {
          height: 120px;
        }
        .recent-card-wrapper .card-content {
          padding: 8px;
        }
        .recent-card-wrapper .card-title {
          font-size: 0.85rem !important;
          margin-bottom: 4px !important;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .recent-card-wrapper .card-price {
          font-size: 0.9rem !important;
          margin-bottom: 4px !important;
        }
        .recent-card-wrapper .card-location {
          font-size: 0.75rem;
          margin-bottom: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .recent-card-wrapper .card-specs {
          font-size: 0.75rem;
          gap: 4px;
          flex-wrap: wrap;
        }
        .recent-card-wrapper .badge {
          padding: 2px 6px;
          font-size: 0.65rem;
        }
      `}</style>
    </div>
  );
};

export default RecentListings;
