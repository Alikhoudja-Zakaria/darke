import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import FilterBar from '../components/FilterBar';
import SearchBar from '../components/SearchBar';
import ListingGrid from '../components/ListingGrid';
import RecentListings from '../components/RecentListings';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { filterListings } from '../utils/filterUtils';
import './Home.css';

const CATALOG_FETCH_LIMIT = 500;
const INITIAL_DISPLAY_COUNT = 24;
const DISPLAY_BATCH_SIZE = 24;

// In-memory SWR cache for instant feed loading (0ms)
let homeCache = { data: null, timestamp: 0 };
const CACHE_TTL = 3 * 60 * 1000; // 3 minutes

const Home = () => {
  const { t } = useLanguage();
  const [rawListings, setRawListings] = useState(() => homeCache.data || []);
  const [loading, setLoading] = useState(() => !homeCache.data || homeCache.data.length === 0);
  const [filters, setFilters] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [visibleCount, setVisibleCount] = useState(INITIAL_DISPLAY_COUNT);

  // Monitor connectivity
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch full active catalog up to 500 listings
  const fetchListings = useCallback(async () => {
    const isFresh = homeCache.data && (Date.now() - homeCache.timestamp < CACHE_TTL);
    if (!homeCache.data) {
      setLoading(true);
    }

    if (isFresh) {
      return;
    }

    try {
      const q = query(
        collection(db, 'listings'),
        orderBy('createdAt', 'desc'),
        limit(CATALOG_FETCH_LIMIT)
      );

      const querySnapshot = await getDocs(q);
      const results = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.category !== 'leisure' && data.status !== 'hidden' && data.status !== 'inactive') {
          results.push({ id: doc.id, ...data });
        }
      });

      if (results.length === 0) {
        // Fallback to locally scraped listings so the site is never empty
        try {
          const res = await fetch('/initial_listings.json');
          if (res.ok) {
            const data = await res.json();
            const fallbackResults = data
              .filter(item => item.category !== 'leisure')
              .map(item => ({ id: item.ouedknissId || item.id, ...item }));
            
            homeCache = { data: fallbackResults, timestamp: Date.now() };
            setRawListings(fallbackResults);
            return;
          }
        } catch (fErr) {
          console.warn("Fallback listings error:", fErr);
        }
      }

      homeCache = { data: results, timestamp: Date.now() };
      setRawListings(results);
    } catch (error) {
      console.warn("Firestore error fetching listings, falling back to local dataset:", error.message);
      try {
        const res = await fetch('/initial_listings.json');
        if (res.ok) {
          const data = await res.json();
          const fallbackResults = data
            .filter(item => item.category !== 'leisure')
            .map(item => ({ id: item.ouedknissId || item.id, ...item }));
          
          homeCache = { data: fallbackResults, timestamp: Date.now() };
          setRawListings(fallbackResults);
        }
      } catch (fErr) {
        console.error("Failed to load fallback listings:", fErr);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters({
      city: '',
      propertyType: '',
      minPrice: '',
      maxPrice: '',
      rooms: '',
      furnished: '',
      transactionType: 'all'
    });
    setSearchQuery('');
    setVisibleCount(INITIAL_DISPLAY_COUNT);
  }, []);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // Reset pagination when filter criteria change
  useEffect(() => {
    setVisibleCount(INITIAL_DISPLAY_COUNT);
  }, [searchQuery, filters]);

  // Compute filtered listings using centralized utility
  const filteredListings = useMemo(() => {
    return filterListings(rawListings, searchQuery, filters);
  }, [rawListings, searchQuery, filters]);

  // Progressive slicing for DOM performance
  const displayedListings = useMemo(() => {
    return filteredListings.slice(0, visibleCount);
  }, [filteredListings, visibleCount]);

  const hasMore = visibleCount < filteredListings.length;

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + DISPLAY_BATCH_SIZE);
  };

  const isFilterActive = Boolean(
    searchQuery ||
    (filters.city && filters.city !== '') ||
    (filters.propertyType && filters.propertyType !== '') ||
    (filters.minPrice && filters.minPrice !== '') ||
    (filters.maxPrice && filters.maxPrice !== '') ||
    (filters.rooms && filters.rooms !== '') ||
    (filters.furnished !== undefined && filters.furnished !== '') ||
    (filters.transactionType && filters.transactionType !== 'all')
  );

  return (
    <div className="home-page">
      {isOffline && (
        <div className="offline-banner">
          <span>📡</span> {t('misc.offline_notice') || 'Mode hors-ligne actif — Consultation des annonces en cache'}
        </div>
      )}
      <div className="hero-section">
        <div className="container">
          <h1 className="hero-title">{t('home.hero_title')}</h1>
          <p className="hero-subtitle">{t('home.hero_subtitle')}</p>
          <div className="hero-search">
            <SearchBar value={searchQuery} onSearch={setSearchQuery} />
          </div>
        </div>
      </div>

      <div className="container home-content">
        <FilterBar filters={filters} onFilterChange={setFilters} />
        {!isFilterActive && (
          <RecentListings />
        )}
        <ListingGrid listings={displayedListings} loading={loading} onResetFilters={handleResetFilters} />
        
        {hasMore && !loading && (
          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <button 
              className="btn-outline" 
              onClick={handleLoadMore}
            >
              {t('misc.load_more') || 'Afficher plus'} ({filteredListings.length - visibleCount} restants)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
