import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { FiLogOut, FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { collection, query, where, orderBy, limit, startAfter, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { deleteListing } from '../firebase/listings';
import ListingGrid from '../components/ListingGrid';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [myListings, setMyListings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination states
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const PAGE_SIZE = 40;

  const fetchMyListings = async () => {
    if (!user) return;
    setLoading(true);
    setHasMore(true);
    try {
      const q = query(
        collection(db, 'listings'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(PAGE_SIZE)
      );
      const snapshot = await getDocs(q);
      const results = [];
      snapshot.forEach(doc => {
        results.push({ id: doc.id, ...doc.data() });
      });
      // Pagination update
      const lastVisible = snapshot.docs[snapshot.docs.length - 1];
      setLastDoc(lastVisible);
      setHasMore(snapshot.docs.length === PAGE_SIZE);

      setMyListings(results);
    } catch (err) {
      console.error("Error fetching user listings:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!lastDoc || !hasMore || !user) return;
    setLoadingMore(true);
    try {
      const q = query(
        collection(db, 'listings'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        startAfter(lastDoc),
        limit(PAGE_SIZE)
      );
      
      const snapshot = await getDocs(q);
      const results = [];
      snapshot.forEach(doc => {
        results.push({ id: doc.id, ...doc.data() });
      });

      // Pagination update
      const lastVisible = snapshot.docs[snapshot.docs.length - 1];
      setLastDoc(lastVisible);
      setHasMore(snapshot.docs.length === PAGE_SIZE);

      setMyListings(prev => [...prev, ...results]);
    } catch (err) {
      console.error("Error loading more user listings:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchMyListings();
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleDelete = async (listingId) => {
    if (window.confirm(t('dashboard.delete_confirm'))) {
      try {
        await deleteListing(listingId);
        setMyListings(prev => prev.filter(l => l.id !== listingId));
      } catch (err) {
        console.error("Error deleting listing:", err);
        alert(t('dashboard.delete_error'));
      }
    }
  };

  const renderActions = (listing) => (
    <>
      <button 
        className="btn-outline" 
        style={{ flex: 1, padding: '8px', fontSize: '14px', borderColor: '#10B981', color: '#10B981' }}
        onClick={(e) => { e.stopPropagation(); navigate(`/edit/${listing.id}`); }}
      >
        <FiEdit2 /> {t('dashboard.edit')}
      </button>
      <button 
        className="btn-outline" 
        style={{ flex: 1, padding: '8px', fontSize: '14px', borderColor: '#EF4444', color: '#EF4444' }}
        onClick={(e) => { e.stopPropagation(); handleDelete(listing.id); }}
      >
        <FiTrash2 /> {t('dashboard.delete')}
      </button>
    </>
  );

  return (
    <div className="container" style={{ paddingTop: '32px', paddingBottom: '40px' }}>
      <div className="dashboard-header">
        <h1>{t('dashboard.title')}</h1>
        <button onClick={handleLogout} className="btn-logout">
          <FiLogOut /> {t('dashboard.logout')}
        </button>
      </div>

      <div className="dashboard-profile card">
        <h2>{t('dashboard.welcome')}, {user.displayName}</h2>
        <p>{t('auth.email')}: {user.email}</p>
        <p>{t('auth.phone')}: {user.phone || t('listing.not_provided')}</p>
      </div>

      <div className="dashboard-listings">
        <div className="dashboard-listings-header">
          <h2>{t('dashboard.my_listings')}</h2>
          <button className="btn-primary" onClick={() => navigate('/post')}>
            <FiPlus /> {t('dashboard.new_listing')}
          </button>
        </div>
        
        {loading ? (
          <ListingGrid loading={true} />
        ) : myListings.length > 0 ? (
          <>
            <ListingGrid listings={myListings} loading={false} renderActions={renderActions} />
            {hasMore && (
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
          </>
        ) : (
          <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🏠</div>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px', fontWeight: 600 }}>{t('dashboard.no_listings')}</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.95rem' }}>{t('dashboard.publish_first')}</p>
            <button className="btn-primary" onClick={() => navigate('/post')}>
              <FiPlus /> {t('dashboard.publish_btn')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

