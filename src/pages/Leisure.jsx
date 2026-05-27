import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import FilterBar from '../components/FilterBar';
import SearchBar from '../components/SearchBar';
import ListingGrid from '../components/ListingGrid';
import RecentListings from '../components/RecentListings';
import { collection, query, where, orderBy, limit, startAfter, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

const Leisure = () => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, searchQuery]);

  const fetchListings = async () => {
    setLoading(true);
    setHasMore(true);
    try {
      let q = query(
        collection(db, 'listings'),
        where('category', '==', 'leisure'),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc'),
        limit(PAGE_SIZE)
      );

      const querySnapshot = await getDocs(q);
      let results = [];
      querySnapshot.forEach((doc) => {
        results.push({ id: doc.id, ...doc.data() });
      });

      // Pagination update
      const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
      setLastDoc(lastVisible);
      setHasMore(querySnapshot.docs.length === PAGE_SIZE);

      let filteredResults = results;
      
      if (searchQuery) {
        filteredResults = filteredResults.filter(item => 
          item.city?.toLowerCase().includes(searchQuery.toLowerCase()) || 
          item.title?.toLowerCase().includes(searchQuery.toLowerCase())
        );
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
      
      setListings(filteredResults);
    } catch (error) {
      console.error("Error fetching leisure listings:", error);
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
        where('category', '==', 'leisure'),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc'),
        startAfter(lastDoc),
        limit(PAGE_SIZE)
      );

      const querySnapshot = await getDocs(q);
      let results = [];
      querySnapshot.forEach((doc) => {
        results.push({ id: doc.id, ...doc.data() });
      });

      // Pagination update
      const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
      setLastDoc(lastVisible);
      setHasMore(querySnapshot.docs.length === PAGE_SIZE);

      let filteredResults = results;
      
      if (searchQuery) {
        filteredResults = filteredResults.filter(item => 
          item.city?.toLowerCase().includes(searchQuery.toLowerCase()) || 
          item.title?.toLowerCase().includes(searchQuery.toLowerCase())
        );
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
      console.error("Error loading more leisure listings:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="home-page">
      <div className="hero-section" style={{ 
        backgroundImage: 'linear-gradient(135deg, rgba(245, 158, 11, 0.9) 0%, rgba(217, 119, 6, 0.9) 100%), url("https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundBlendMode: 'overlay'
      }}>
        <div className="container">
          <h1 className="hero-title">{t('nav.leisure')}</h1>
          <p className="hero-subtitle">{t('home.leisure_subtitle')}</p>
          <div className="hero-search">
            <SearchBar onSearch={setSearchQuery} />
          </div>
        </div>
      </div>

      <div className="container home-content">
        {!filters.city && !filters.propertyType && !searchQuery && <RecentListings />}
        <FilterBar onFilterChange={setFilters} forceLeisureMode={true} />
        <ListingGrid listings={listings} loading={loading} />

        {hasMore && !loading && (
          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <button 
              className="btn-outline" 
              onClick={loadMore} 
              disabled={loadingMore}
              style={{ minWidth: '200px' }}
            >
              {loadingMore ? (t('misc.loading') || 'Chargement...') : (t('misc.load_more') || 'Afficher plus d\'annonces')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leisure;
