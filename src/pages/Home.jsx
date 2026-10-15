import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import FilterBar from '../components/FilterBar';
import SearchBar from '../components/SearchBar';
import ListingGrid from '../components/ListingGrid';
import RecentListings from '../components/RecentListings';
import { collection, query, orderBy, limit, startAfter, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { getCityDisplayName } from '../utils/cityUtils';
import './Home.css';

const PAGE_SIZE = 20;

const applyFilters = (items, searchQuery, filters) => {
  let filtered = items;

  if (searchQuery) {
    const queryLower = searchQuery.toLowerCase().trim();
    filtered = filtered.filter(item => {
      const cityFr = (item.city || '').toLowerCase();
      const cityAr = (getCityDisplayName(item.city, 'ar') || '').toLowerCase();
      const title = (item.title || '').toLowerCase();
      const desc = (item.description || '').toLowerCase();
      return cityFr.includes(queryLower) || 
        cityAr.includes(queryLower) || 
        title.includes(queryLower) || 
        desc.includes(queryLower);
    });
  }

  if (filters.transactionType && filters.transactionType !== 'all') {
    if (filters.transactionType === 'buy' || filters.transactionType === 'sale') {
      filtered = filtered.filter(item => item.transactionType === 'buy' || item.transactionType === 'sale' || item.priceUnit === 'total');
    } else if (filters.transactionType === 'rent') {
      filtered = filtered.filter(item => (item.transactionType === 'rent' || item.priceUnit === 'per-month' || item.priceUnit === 'per-night') && item.transactionType !== 'sale' && item.priceUnit !== 'total');
    }
  }

  if (filters.city) {
    const filterCityLower = filters.city.toLowerCase();
    filtered = filtered.filter(item => {
      const itemCityFr = (item.city || '').toLowerCase();
      const itemCityAr = (getCityDisplayName(item.city, 'ar') || '').toLowerCase();
      return itemCityFr === filterCityLower || itemCityAr === filterCityLower;
    });
  }

  if (filters.propertyType) {
    filtered = filtered.filter(item => item.propertyType === filters.propertyType);
  }

  if (filters.minPrice && !isNaN(Number(filters.minPrice))) {
    filtered = filtered.filter(item => Number(item.price) >= Number(filters.minPrice));
  }

  if (filters.maxPrice && !isNaN(Number(filters.maxPrice))) {
    filtered = filtered.filter(item => Number(item.price) <= Number(filters.maxPrice));
  }

  if (filters.rooms && !isNaN(Number(filters.rooms))) {
    const roomCount = Number(filters.rooms);
    if (roomCount >= 4) {
      filtered = filtered.filter(item => Number(item.rooms) >= 4);
    } else {
      filtered = filtered.filter(item => Number(item.rooms) === roomCount);
    }
  }

  if (filters.furnished !== undefined && filters.furnished !== '') {
    const isFurnished = filters.furnished === 'true' || filters.furnished === true;
    filtered = filtered.filter(item => Boolean(item.furnished) === isFurnished);
  }

  return filtered;
};

// In-memory SWR cache for instant feed loading (0ms)
let homeCache = { data: null, timestamp: 0 };
const CACHE_TTL = 3 * 60 * 1000; // 3 minutes

const Home = () => {
  const { t } = useLanguage();
  const [rawListings, setRawListings] = useState(() => homeCache.data || []);
  const [listings, setListings] = useState(() => homeCache.data || []);
  const [loading, setLoading] = useState(() => !homeCache.data || homeCache.data.length === 0);
  const [filters, setFilters] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  // Pagination states
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

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

  // Fetch initial batch from Firestore only once on mount (or revalidate SWR)
  const fetchListings = useCallback(async () => {
    // If cache is fresh, don't show loading spinner
    const isFresh = homeCache.data && (Date.now() - homeCache.timestamp < CACHE_TTL);
    if (!homeCache.data) {
      setLoading(true);
    }
    setHasMore(true);

    if (isFresh) {
      return;
    }

    try {
      const q = query(
        collection(db, 'listings'),
        orderBy('createdAt', 'desc'),
        limit(PAGE_SIZE)
      );

      const querySnapshot = await getDocs(q);
      const results = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.category !== 'leisure' && data.status !== 'hidden') {
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
            setHasMore(false);
            return;
          }
        } catch (fErr) {
          console.warn("Fallback listings error:", fErr);
        }
      }

      // Pagination update
      const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
      setLastDoc(lastVisible);
      setHasMore(querySnapshot.docs.length === PAGE_SIZE);

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
          setHasMore(false);
        }
      } catch (fErr) {
        console.error("Failed to load fallback listings:", fErr);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters({});
    setSearchQuery('');
  }, []);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // Apply filters in memory without burning Firestore reads on Spark plan
  useEffect(() => {
    setListings(applyFilters(rawListings, searchQuery, filters));
  }, [rawListings, searchQuery, filters]);

  const loadMore = async () => {
    if (!lastDoc || !hasMore) return;
    setLoadingMore(true);
    try {
      const q = query(
        collection(db, 'listings'),
        orderBy('createdAt', 'desc'),
        startAfter(lastDoc),
        limit(PAGE_SIZE)
      );

      const querySnapshot = await getDocs(q);
      const results = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.category !== 'leisure' && data.status !== 'hidden') {
          results.push({ id: doc.id, ...data });
        }
      });

      // Pagination update
      const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
      setLastDoc(lastVisible);
      setHasMore(querySnapshot.docs.length === PAGE_SIZE);

      setRawListings(prev => [...prev, ...results]);
    } catch (error) {
      console.error("Error loading more listings:", error);
    } finally {
      setLoadingMore(false);
    }
  };

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
            <SearchBar onSearch={setSearchQuery} />
          </div>
        </div>
      </div>

      <div className="container home-content">
        <FilterBar onFilterChange={setFilters} />
        {!filters.city && !filters.propertyType && !searchQuery && (!filters.transactionType || filters.transactionType === 'all') && (
          <RecentListings />
        )}
        <ListingGrid listings={listings} loading={loading} onResetFilters={handleResetFilters} />
        
        {hasMore && !loading && (
          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <button 
              className="btn-outline" 
              onClick={loadMore} 
              disabled={loadingMore}
            >
              {loadingMore ? (t('misc.loading') || 'Chargement...') : (t('misc.load_more') || 'Afficher plus')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
