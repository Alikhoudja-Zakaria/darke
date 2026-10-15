import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useRecentListings } from '../hooks/useRecentListings';
import { collection, getDocs, query, where, documentId } from 'firebase/firestore';
import { db } from '../firebase/config';
import PropertyCard from './PropertyCard';
import { FiClock, FiTrash2 } from 'react-icons/fi';
import './RecentListings.css';

const RecentListings = () => {
  const { t } = useLanguage();
  const { recentIds, clearRecent } = useRecentListings();
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
        const resultsMap = new Map();
        const chunkSize = 30;
        const chunkPromises = [];
        
        for (let i = 0; i < recentIds.length; i += chunkSize) {
          const chunk = recentIds.slice(i, i + chunkSize);
          const q = query(
            collection(db, 'listings'),
            where(documentId(), 'in', chunk),
            where('status', '==', 'active')
          );
          chunkPromises.push(getDocs(q));
        }

        const snapshots = await Promise.all(chunkPromises);
        snapshots.forEach(snapshot => {
          snapshot.forEach(docSnap => {
            resultsMap.set(docSnap.id, { id: docSnap.id, ...docSnap.data() });
          });
        });
        
        // Check local backup fallback for any missing IDs
        const missingIds = recentIds.filter(id => !resultsMap.has(id));
        if (missingIds.length > 0) {
          try {
            const res = await fetch('/initial_listings.json');
            if (res.ok) {
              const data = await res.json();
              data.forEach(item => {
                const itemId = String(item.ouedknissId || item.id);
                if (missingIds.includes(itemId)) {
                  resultsMap.set(itemId, { id: itemId, ...item });
                }
              });
            }
          } catch (fallbackError) {
            console.warn("Could not load from fallback dataset in RecentListings:", fallbackError.message);
          }
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
    <section className="recent-listings-section" aria-label={t('home.recently_viewed')}>
      <div className="recent-header">
        <div className="recent-title-group">
          <FiClock className="recent-title-icon" />
          <h2 className="recent-title">{t('home.recently_viewed') || 'Consultés récemment'}</h2>
          <span className="recent-count-pill">{recentListings.length}</span>
        </div>
        <button 
          type="button"
          onClick={clearRecent}
          className="recent-clear-btn"
          title={t('filters.reset') || 'Effacer'}
        >
          <FiTrash2 size={13} />
          <span>{t('filters.reset') || 'Effacer'}</span>
        </button>
      </div>

      <div className="recent-grid-wrapper">
        <div className="recent-grid">
          {recentListings.map(listing => (
            <div key={listing.id} className="recent-card-wrapper">
              <PropertyCard listing={listing} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RecentListings;
