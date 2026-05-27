import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useRecentListings } from '../hooks/useRecentListings';
import { collection, getDocs, query, where, documentId } from 'firebase/firestore';
import { db } from '../firebase/config';
import PropertyCard from './PropertyCard';
import { FiChevronUp, FiChevronDown } from 'react-icons/fi';

const RecentListings = () => {
  const { t } = useLanguage();
  const { recentIds } = useRecentListings();
  const [recentListings, setRecentListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const fetchRecent = async () => {
      if (!recentIds || recentIds.length === 0) {
        setRecentListings([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const resultsMap = new Map();
        const chunkSize = 30;
        
        for (let i = 0; i < recentIds.length; i += chunkSize) {
          const chunk = recentIds.slice(i, i + chunkSize);
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
        
        // Preserve the original order from recentIds
        const orderedResults = recentIds
          .map(id => resultsMap.get(id))
          .filter(Boolean);
          
        setRecentListings(orderedResults);
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
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          width: '100%',
          background: 'none',
          border: 'none',
          padding: '0',
          cursor: 'pointer',
          marginBottom: '16px',
          textAlign: 'left'
        }}
      >
        <h2 style={{ fontSize: '1.5rem', color: '#111827', margin: 0 }}>
          {t('home.recently_viewed')}
        </h2>
        <div style={{ 
          color: '#6B7280', 
          display: 'flex',
          transform: isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.3s ease-in-out'
        }}>
          <FiChevronUp size={24} />
        </div>
      </button>
      
      <div 
        style={{
          display: 'grid',
          gridTemplateRows: isCollapsed ? '0fr' : '1fr',
          transition: 'grid-template-rows 0.3s ease-in-out'
        }}
      >
        <div style={{ overflow: 'hidden' }}>
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
        </div>
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
