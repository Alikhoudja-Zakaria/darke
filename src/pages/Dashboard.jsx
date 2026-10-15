import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { FiLogOut, FiPlus, FiEdit2, FiTrash2, FiShield } from 'react-icons/fi';
import { collection, query, where, orderBy, limit, startAfter, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { deleteListing } from '../firebase/listings';
import { isUserAdmin } from '../utils/adminAuth';
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

  const fetchMyListings = useCallback(async () => {
    if (!user?.uid) return;
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
  }, [user]);

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
  }, [fetchMyListings]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const [deletingId, setDeletingId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await deleteListing(deletingId);
      setMyListings(prev => prev.filter(l => l.id !== deletingId));
      setDeletingId(null);
    } catch (err) {
      console.error("Error deleting listing:", err);
      alert(t('dashboard.delete_error') || "Erreur lors de la suppression.");
    } finally {
      setIsDeleting(false);
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
        onClick={(e) => { e.stopPropagation(); setDeletingId(listing.id); }}
      >
        <FiTrash2 /> {t('dashboard.delete')}
      </button>
    </>
  );

  if (!user) {
    return null;
  }

  return (
    <div className="container" style={{ paddingTop: '32px', paddingBottom: '40px' }}>
      <div className="dashboard-header">
        <h1>{t('dashboard.title')}</h1>
        <button onClick={handleLogout} className="btn-logout">
          <FiLogOut /> {t('dashboard.logout')}
        </button>
      </div>

      {isUserAdmin(user) && (
        <div className="card" style={{ 
          background: 'linear-gradient(135deg, #FEF3C7 0%, #FFFBEB 100%)', 
          border: '1px solid #FDE68A', 
          padding: '20px 24px', 
          marginBottom: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          borderRadius: 'var(--radius-lg)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#B45309', fontWeight: 700, fontSize: '1.15rem', marginBottom: '4px' }}>
              <FiShield size={22} /> {t('admin.title') || "Panneau d'administration"}
            </div>
            <p style={{ color: '#92400E', fontSize: '0.9rem', margin: 0 }}>
              Vous êtes connecté avec les privilèges Super Administrateur (<strong>{user?.email}</strong>).
            </p>
          </div>
          <button 
            type="button"
            className="btn-primary" 
            style={{ backgroundColor: '#D97706', borderColor: '#D97706', whiteSpace: 'nowrap' }}
            onClick={() => navigate('/admin')}
          >
            Accéder à l'administration (/admin) →
          </button>
        </div>
      )}

      <div className="dashboard-profile card">
        <h2>{t('dashboard.welcome')}, {user?.displayName}</h2>
        <p>{t('auth.email')}: {user?.email}</p>
        <p>{t('auth.phone')}: {user?.phone || t('listing.not_provided')}</p>
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

      {deletingId && (
        <div className="modal-backdrop" onClick={() => !isDeleting && setDeletingId(null)}>
          <div className="modal-content card" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: '12px', fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {t('dashboard.delete')}
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.5 }}>
              {t('dashboard.delete_confirm')}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                type="button" 
                className="btn-outline" 
                onClick={() => setDeletingId(null)}
                disabled={isDeleting}
              >
                {t('misc.no') || 'Annuler'}
              </button>
              <button 
                type="button" 
                style={{
                  backgroundColor: '#EF4444',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '10px 18px',
                  borderRadius: 'var(--radius-pill)',
                  fontWeight: 600,
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  opacity: isDeleting ? 0.7 : 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onClick={confirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (t('misc.loading') || 'Suppression...') : (t('dashboard.delete') || 'Supprimer')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

