import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebase/config';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { useLanguage } from '../context/LanguageContext';
import { FiPhone, FiCalendar, FiUser } from 'react-icons/fi';
import ListingGrid from '../components/ListingGrid';
import './UserProfile.css';

const UserProfile = () => {
  const { id } = useParams();
  const { t } = useLanguage();
  const [profileData, setProfileData] = useState(null);
  const [userListings, setUserListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserProfile = async () => {
      setLoading(true);
      setError('');
      try {
        // 1. Fetch user data
        const userDoc = await getDoc(doc(db, 'users', id));
        let userData = null;
        
        if (userDoc.exists()) {
          userData = userDoc.data();
        } else {
          // Fallback if no user profile exists, we can still fetch their listings
          userData = {
            displayName: "Utilisateur",
            phone: null,
            createdAt: null
          };
        }
        setProfileData(userData);

        // 2. Fetch user's active listings
        const q = query(
          collection(db, 'listings'),
          where('userId', '==', id),
          where('status', '==', 'active'),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        const listingsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUserListings(listingsData);

      } catch (err) {
        console.error("Error fetching user profile:", err);
        setError("Erreur lors du chargement du profil.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchUserProfile();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="container" style={{ padding: '60px 0', minHeight: 'calc(100vh - 200px)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="loading-spinner"></div>
          <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>{t('misc.loading') || 'Chargement...'}</p>
        </div>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="container" style={{ padding: '60px 0', minHeight: 'calc(100vh - 200px)', textAlign: 'center' }}>
        <h2>Une erreur est survenue.</h2>
      </div>
    );
  }

  const joinDate = profileData.createdAt ? new Date(profileData.createdAt).toLocaleDateString() : null;
  const initial = profileData.displayName ? profileData.displayName.charAt(0).toUpperCase() : 'U';

  return (
    <div className="container" style={{ padding: '40px 0', minHeight: 'calc(100vh - 200px)' }}>
      
      <div className="user-profile-header">
        <div className="profile-avatar-large">
          {initial}
        </div>
        <h1 className="profile-name">{profileData.displayName || 'Utilisateur'}</h1>
        
        <div className="profile-meta">
          {profileData.phone && (
            <div className="profile-meta-item">
              <FiPhone /> <span>{profileData.phone}</span>
            </div>
          )}
          {joinDate && (
            <div className="profile-meta-item">
              <FiCalendar /> <span>{t('profile.joined') || 'Membre depuis'} {joinDate}</span>
            </div>
          )}
        </div>

        <div className="profile-stats">
          <div className="stat-item">
            <span className="stat-value">{userListings.length}</span>
            <span className="stat-label">{t('profile.active_listings') || 'annonces actives'}</span>
          </div>
        </div>
      </div>

      <div className="user-profile-listings">
        <h2 style={{ marginBottom: '24px' }}>
          {t('profile.title') || 'Profil de'} {profileData.displayName || 'Utilisateur'}
        </h2>
        
        {userListings.length > 0 ? (
          <ListingGrid listings={userListings} loading={false} />
        ) : (
          <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)' }}>{t('profile.no_listings') || "Cet utilisateur n'a pas d'annonces actives."}</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default UserProfile;
