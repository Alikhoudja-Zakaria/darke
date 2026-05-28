import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import FilterBar from '../components/FilterBar';
import SearchBar from '../components/SearchBar';
import ListingGrid from '../components/ListingGrid';
import RecentListings from '../components/RecentListings';
import { collection, query, where, orderBy, limit, startAfter, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import './Home.css';

const Home = () => {
  const { t } = useLanguage();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination states
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const PAGE_SIZE = 40;

  useEffect(() => {
    fetchListings();
  }, [filters, searchQuery]);

  const fetchListings = async () => {
    setLoading(true);
    setHasMore(true);
    try {
      let q = query(
        collection(db, 'listings'),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc'),
        limit(PAGE_SIZE)
      );

      // We apply filters in memory for simplicity in V1, as Firestore complex queries require composite indexes
      const querySnapshot = await getDocs(q);
      let results = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.category !== 'leisure') {
          results.push({ id: doc.id, ...data });
        }
      });

      // Pagination update
      const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
      setLastDoc(lastVisible);
      setHasMore(querySnapshot.docs.length === PAGE_SIZE);

      // Apply local filtering on the fetched page
      let filteredResults = results;

      if (searchQuery) {
        const queryLower = searchQuery.toLowerCase();
        filteredResults = filteredResults.filter(item => 
          item.city?.toLowerCase().includes(queryLower) || 
          item.title?.toLowerCase().includes(queryLower) ||
          item.description?.toLowerCase().includes(queryLower)
        );
      }

      if (filters.transactionType && filters.transactionType !== 'all') {
        filteredResults = filteredResults.filter(item => item.transactionType === filters.transactionType);
      }

      if (filters.city) {
        filteredResults = filteredResults.filter(item => item.city === filters.city);
      }
      
      if (filters.propertyType) {
        filteredResults = filteredResults.filter(item => item.propertyType === filters.propertyType);
      }

      if (filters.minPrice) {
        filteredResults = filteredResults.filter(item => item.price >= parseInt(filters.minPrice));
      }

      if (filters.maxPrice) {
        filteredResults = filteredResults.filter(item => item.price <= parseInt(filters.maxPrice));
      }

      if (filters.rooms) {
        if (filters.rooms === '4') {
          filteredResults = filteredResults.filter(item => item.rooms >= 4);
        } else {
          filteredResults = filteredResults.filter(item => item.rooms === parseInt(filters.rooms));
        }
      }

      if (filters.furnished) {
        const isFurnished = filters.furnished === 'true';
        filteredResults = filteredResults.filter(item => item.furnished === isFurnished);
      }

      setListings(filteredResults);
    } catch (error) {
      console.error("Error fetching listings:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!lastDoc || !hasMore) return;
    setLoadingMore(true);
    try {
      let q = query(
        collection(db, 'listings'),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc'),
        startAfter(lastDoc),
        limit(PAGE_SIZE)
      );

      const querySnapshot = await getDocs(q);
      let results = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.category !== 'leisure') {
          results.push({ id: doc.id, ...data });
        }
      });

      // Pagination update
      const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
      setLastDoc(lastVisible);
      setHasMore(querySnapshot.docs.length === PAGE_SIZE);

      let filteredResults = results;

      if (searchQuery) {
        const queryLower = searchQuery.toLowerCase();
        filteredResults = filteredResults.filter(item => 
          item.city?.toLowerCase().includes(queryLower) || 
          item.title?.toLowerCase().includes(queryLower) ||
          item.description?.toLowerCase().includes(queryLower)
        );
      }
      
      if (filters.transactionType && filters.transactionType !== 'all') {
        filteredResults = filteredResults.filter(item => item.transactionType === filters.transactionType);
      }

      if (filters.city) filteredResults = filteredResults.filter(item => item.city === filters.city);
      if (filters.propertyType) filteredResults = filteredResults.filter(item => item.propertyType === filters.propertyType);
      if (filters.minPrice) filteredResults = filteredResults.filter(item => item.price >= parseInt(filters.minPrice));
      if (filters.maxPrice) filteredResults = filteredResults.filter(item => item.price <= parseInt(filters.maxPrice));
      if (filters.rooms) {
        if (filters.rooms === '4') filteredResults = filteredResults.filter(item => item.rooms >= 4);
        else filteredResults = filteredResults.filter(item => item.rooms === parseInt(filters.rooms));
      }
      if (filters.furnished) {
        const isFurnished = filters.furnished === 'true';
        filteredResults = filteredResults.filter(item => item.furnished === isFurnished);
      }

      setListings(prev => [...prev, ...filteredResults]);
    } catch (error) {
      console.error("Error loading more listings:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="home-page">
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
        {!filters.city && !filters.propertyType && !searchQuery && <RecentListings />}
        <FilterBar onFilterChange={setFilters} />
        <ListingGrid listings={listings} loading={loading} />
        
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
