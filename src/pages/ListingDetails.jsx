import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useLanguage } from '../context/LanguageContext';
import { useRecentListings } from '../hooks/useRecentListings';
import { formatPrice } from '../utils/formatPrice';
import ImageCarousel from '../components/ImageCarousel';
import RecentListings from '../components/RecentListings';
import { FiMapPin, FiPhone, FiMessageCircle, FiArrowLeft, FiShare2, FiUser } from 'react-icons/fi';
import './ListingDetails.css';
import '../pages/UserProfile.css';

const ListingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const { addRecentListing } = useRecentListings();
  const [listing, setListing] = useState(null);
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const docRef = doc(db, 'listings', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().status === 'active') {
          const data = docSnap.data();
          setListing({ id: docSnap.id, ...data });
          addRecentListing(docSnap.id);
          
          if (data.userId) {
            try {
              const userRef = doc(db, 'users', data.userId);
              const userSnap = await getDoc(userRef);
              if (userSnap.exists()) {
                setSeller(userSnap.data());
              }
            } catch (err) {
              console.error("Error fetching seller:", err);
            }
          }
        } else {
          setError(t('misc.not_found') || "Annonce introuvable.");
        }
      } catch (error) {
        console.error("Error fetching listing:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchListing();
  }, [id]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: listing.title,
          text: `Découvrez cette annonce sur Darkoum : ${listing.title}`,
          url: window.location.href,
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      setToast(t('listing.copied') || 'Lien copié !');
      setTimeout(() => setToast(''), 3000);
    }
  };

  if (loading) return <div className="container" style={{ padding: '40px 0' }}>{t('misc.loading') || 'Chargement...'}</div>;
  if (!listing) return <div className="container" style={{ padding: '40px 0' }}>{t('misc.not_found') || 'Annonce introuvable.'}</div>;

  return (
    <div className="listing-details">
      <div className="container">
        <button className="btn-back" onClick={() => navigate(-1)}>
          <FiArrowLeft /> {t('listing.back') || 'Retour'}
        </button>
        
        <div className="details-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="details-title">{listing.title}</h1>
            <div className="details-location">
              <FiMapPin /> {listing.city}
            </div>
          </div>
          <button className="btn-outline" onClick={handleShare} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiShare2 /> {t('listing.share') || 'Partager'}
          </button>
        </div>

        <div className="details-image-gallery">
          <ImageCarousel images={listing.images} isDetails={true} />
        </div>

        <div className="details-content">
          <div className="details-main">
            <div className="details-price">
              {formatPrice(listing.price, lang)} 
              {listing.priceUnit && listing.priceUnit !== 'total' && (
                <span className="price-unit">
                  {listing.priceUnit === 'per-month' ? t('listing.per_month') : 
                   listing.priceUnit === 'per-night' ? t('listing.per_night') : 
                   listing.priceUnit === 'per-week' ? t('listing.per_week') : ''}
                </span>
              )}
            </div>

            <div className="details-specs">
              {listing.rooms > 0 && <div><strong>{t('listing.rooms')}:</strong> {listing.rooms}</div>}
              {listing.bathrooms > 0 && <div><strong>{t('listing.baths')}:</strong> {listing.bathrooms}</div>}
              {listing.surface > 0 && <div><strong>{t('listing.surface')}:</strong> {listing.surface}</div>}
            </div>

            <div className="details-description">
              <h3>{t('listing.description') || 'Description'}</h3>
              <p>{listing.description}</p>
            </div>
          </div>

          <div className="details-sidebar">
            {listing.userId && (
              <Link to={`/user/${listing.userId}`} className="seller-profile-badge">
                <div className="seller-avatar">
                  {seller?.displayName ? seller.displayName.charAt(0).toUpperCase() : <FiUser />}
                </div>
                <div className="seller-info">
                  <span className="seller-label">{t('listing.published_by') || 'Publiée par'}</span>
                  <span className="seller-name">{seller?.displayName || 'Utilisateur'}</span>
                </div>
              </Link>
            )}

            <div className="card contact-card">
              <h3>{t('listing.contact_owner') || 'Contacter le propriétaire'}</h3>
              <div className="contact-info">
                <FiPhone /> <span>{listing.phone || t('listing.not_provided') || 'Non renseigné'}</span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <a 
                  href={`tel:${listing.phone}`}
                  className="btn-primary contact-btn"
                  style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
                >
                  <FiPhone /> {t('listing.call') || 'Appeler'}
                </a>
                
                <a 
                  href={`https://wa.me/213${listing.phone?.replace(/^0/, '')}?text=Bonjour, je suis intéressé(e) par votre annonce : ${listing.title}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-accent contact-btn whatsapp"
                  style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
                >
                  <FiMessageCircle /> {t('listing.whatsapp')}
                </a>
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '64px', paddingTop: '40px', borderTop: '1px solid var(--border-color)' }}>
          <RecentListings />
        </div>
      </div>
      
      {toast && (
        <div className="toast-notification">
          {toast}
        </div>
      )}
    </div>
  );
};

export default ListingDetails;
