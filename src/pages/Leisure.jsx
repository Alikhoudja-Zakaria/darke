import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import FilterBar from '../components/FilterBar';
import ListingGrid from '../components/ListingGrid';
import { collection, query, where, orderBy, limit, startAfter, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

const Leisure = () => {
  const { t } = useLanguage();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});

  // Pagination states
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const PAGE_SIZE = 40;

  useEffect(() => {
    fetchListings();
  }, [filters]);

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
      // Apply basic local filtering
      if (filters.city) filteredResults = filteredResults.filter(item => item.city === filters.city);
      if (filters.propertyType) filteredResults = filteredResults.filter(item => item.propertyType === filters.propertyType);
      
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
      if (filters.city) filteredResults = filteredResults.filter(item => item.city === filters.city);
      if (filters.propertyType) filteredResults = filteredResults.filter(item => item.propertyType === filters.propertyType);
      
      setListings(prev => [...prev, ...filteredResults]);
    } catch (error) {
      console.error("Error loading more leisure listings:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="home-page">
      <div className="hero-section" style={{ backgroundImage: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' }}>
        <div className="container">
          <h1 className="hero-title">{t('nav.leisure')}</h1>
          <p className="hero-subtitle">{t('home.leisure_subtitle')}</p>
        </div>
      </div>

      <div className="container home-content">
        <FilterBar onFilterChange={setFilters} />
        <ListingGrid listings={listings} loading={loading} />

        {hasMore && !loading && (
          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <button 
              className="btn-outline" 
              onClick={loadMore} 
              disabled={loadingMore}
              style={{ minWidth: '200px' }}
            >
              {loadingMore ? 'Chargement...' : 'Afficher plus d\'annonces'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leisure;
