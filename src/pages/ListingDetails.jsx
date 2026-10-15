import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { isUserAdmin } from '../utils/adminAuth';
import { useRecentListings } from '../hooks/useRecentListings';
import { formatPrice, formatPriceCentimes } from '../utils/formatPrice';
import { getCityDisplayName } from '../utils/cityUtils';
import ImageCarousel from '../components/ImageCarousel';
import RecentListings from '../components/RecentListings';
import ReportModal from '../components/ReportModal';
import { FiMapPin, FiPhone, FiMessageCircle, FiArrowLeft, FiArrowRight, FiShare2, FiUser, FiFlag } from 'react-icons/fi';
import './ListingDetails.css';
import '../pages/UserProfile.css';

const ListingDetails = () => {
  // Helper function to format and sanitize phone numbers
  const formatPhoneNumber = (phone, forWhatsApp = false) => {
    if (!phone) return '';
    // Remove whitespace, dots, dashes
    let sanitized = String(phone).replace(/[\s.\-()]/g, '');
    if (forWhatsApp) {
      // Strip any existing country code prefix, then return bare digits
      // Handles: +213..., 00213..., 213..., 0...
      sanitized = sanitized.replace(/^\+?(?:00)?213/, '').replace(/^0/, '');
    }
    return sanitized;
  };

  const { id } = useParams();
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const { addRecentListing } = useRecentListings();
  const [listing, setListing] = useState(null);
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState('');
  const [reportModalOpen, setReportModalOpen] = useState(false);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const docRef = doc(db, 'listings', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.status === 'hidden' && !isUserAdmin(user) && user?.uid !== data.userId) {
            setError(t('misc.not_found') || "Annonce introuvable ou indisponible.");
            return;
          }
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
          // Check local backup fallback
          const res = await fetch('/initial_listings.json');
          if (res.ok) {
            const data = await res.json();
            const found = data.find(item => String(item.ouedknissId) === String(id) || String(item.id) === String(id));
            if (found) {
              setListing({ id: found.ouedknissId || found.id, ...found });
              addRecentListing(found.ouedknissId || found.id);
              return;
            }
          }
          setError(t('misc.not_found') || "Annonce introuvable.");
        }
      } catch (err) {
        console.warn("Firestore error fetching listing, checking fallback dataset:", err.message);
        try {
          const res = await fetch('/initial_listings.json');
          if (res.ok) {
            const data = await res.json();
            const found = data.find(item => String(item.ouedknissId) === String(id) || String(item.id) === String(id));
            if (found) {
              setListing({ id: found.ouedknissId || found.id, ...found });
              addRecentListing(found.ouedknissId || found.id);
              return;
            }
          }
        } catch (fallbackError) {
          console.warn("Could not load from fallback dataset:", fallbackError.message);
        }
        setError(t('auth.error_generic') || "Une erreur est survenue.");
      } finally {
        setLoading(false);
      }
    };
    fetchListing();
  }, [id, addRecentListing, t, user]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: listing.title,
          text: `${t('listing.share_text')} ${listing.title}`,
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
  if (!listing) return <div className="container" style={{ padding: '40px 0' }}>{error || t('misc.not_found') || 'Annonce introuvable.'}</div>;

  const handleBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const cleanPhone = formatPhoneNumber(listing.phone);
  const waPhone = formatPhoneNumber(listing.phone, true);

  return (
    <div className="listing-details">
      <div className="container">
        <button className="btn-back" onClick={handleBack}>
          {lang === 'ar' ? <FiArrowRight /> : <FiArrowLeft />} {t('listing.back') || 'Retour'}
        </button>
        
        <div className="details-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="details-title">{listing.title}</h1>
            <div className="details-location">
              <FiMapPin /> {getCityDisplayName(listing.city, lang)}
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
              {formatPriceCentimes(listing.price, lang) && (
                <div style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: '500', marginTop: '4px' }}>
                  ≈ {formatPriceCentimes(listing.price, lang)}
                </div>
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
                  href={cleanPhone ? `tel:${cleanPhone}` : '#'}
                  className={`btn-primary contact-btn ${!cleanPhone ? 'disabled' : ''}`}
                  style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
                  onClick={!cleanPhone ? (e) => e.preventDefault() : undefined}
                >
                  <FiPhone /> {t('listing.call') || 'Appeler'}
                </a>
                
                <a 
                  href={cleanPhone ? `https://wa.me/213${waPhone}?text=${encodeURIComponent(t('listing.whatsapp_message'))} ${encodeURIComponent(listing.title || '')}` : '#'}
                  target={cleanPhone ? "_blank" : undefined}
                  rel={cleanPhone ? "noreferrer" : undefined}
                  className={`btn-accent contact-btn whatsapp ${!cleanPhone ? 'disabled' : ''}`}
                  style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
                  onClick={!cleanPhone ? (e) => e.preventDefault() : undefined}
                >
                  <FiMessageCircle /> {t('listing.whatsapp')}
                </a>
              </div>

              <div style={{
                marginTop: '16px',
                padding: '10px 12px',
                backgroundColor: '#FFFBEB',
                border: '1px solid #FDE68A',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.78rem',
                color: '#92400E',
                lineHeight: 1.4,
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px'
              }}>
                <span style={{ fontSize: '1rem', lineHeight: 1 }}>🛡️</span>
                <span>
                  {lang === 'ar' 
                    ? 'نصيحة أمان داركم: لا تدفع أي تسبيق مالي قبل معاينة العقار والتأكد من الوثائق حضورياً.' 
                    : 'Sécurité Darkoum : Ne versez aucun acompte avant d\'avoir visité le bien et vérifié les actes légaux.'}
                </span>
              </div>
            </div>

            <div style={{ marginTop: '14px', textAlign: 'center' }}>
              <button 
                type="button"
                onClick={() => setReportModalOpen(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '4px 8px',
                  fontSize: '0.82rem',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'color var(--transition-fast)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#EF4444'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
              >
                <FiFlag size={13} /> {t('listing.report_or_takedown') || 'Signaler ou demander le retrait de cette annonce'}
              </button>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '64px', paddingTop: '40px', borderTop: '1px solid var(--border-color)' }}>
          <RecentListings />
        </div>
      </div>
      
      {/* Mobile Sticky Contact Bar */}
      <div className="mobile-sticky-contact-bar">
        <a 
          href={cleanPhone ? `tel:${cleanPhone}` : '#'}
          className={`btn-primary contact-btn ${!cleanPhone ? 'disabled' : ''}`}
          onClick={!cleanPhone ? (e) => e.preventDefault() : undefined}
        >
          <FiPhone /> {t('listing.call') || 'Appeler'}
        </a>
        <a 
          href={cleanPhone ? `https://wa.me/213${waPhone}?text=${encodeURIComponent(t('listing.whatsapp_message'))} ${encodeURIComponent(listing.title || '')}` : '#'}
          target={cleanPhone ? "_blank" : undefined}
          rel={cleanPhone ? "noreferrer" : undefined}
          className={`btn-accent contact-btn whatsapp ${!cleanPhone ? 'disabled' : ''}`}
          onClick={!cleanPhone ? (e) => e.preventDefault() : undefined}
        >
          <FiMessageCircle /> {t('listing.whatsapp')}
        </a>
      </div>

      {toast && (
        <div className="toast-notification">
          {toast}
        </div>
      )}

      {/* Interactive Report Modal */}
      <ReportModal 
        isOpen={reportModalOpen} 
        onClose={() => setReportModalOpen(false)} 
        listing={listing} 
      />
    </div>
  );
};

export default ListingDetails;
