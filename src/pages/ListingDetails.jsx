import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useLanguage } from '../context/LanguageContext';
import { useRecentListings } from '../hooks/useRecentListings';
import { formatPrice } from '../utils/formatPrice';
import ImageCarousel from '../components/ImageCarousel';
import { FiMapPin, FiPhone, FiMessageCircle, FiArrowLeft } from 'react-icons/fi';
import './ListingDetails.css';

const ListingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const { addRecentListing } = useRecentListings();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const docRef = doc(db, 'listings', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().status === 'active') {
          setListing({ id: docSnap.id, ...docSnap.data() });
          addRecentListing(docSnap.id);
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

  if (loading) return <div className="container" style={{ padding: '40px 0' }}>Chargement...</div>;
  if (!listing) return <div className="container" style={{ padding: '40px 0' }}>Annonce introuvable.</div>;

  return (
    <div className="listing-details">
      <div className="container">
        <button className="btn-back" onClick={() => navigate(-1)}>
          <FiArrowLeft /> {t('listing.back') || 'Retour'}
        </button>
        
        <div className="details-header">
          <h1 className="details-title">{listing.title}</h1>
          <div className="details-location">
            <FiMapPin /> {listing.city}
          </div>
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
            <div className="card contact-card">
              <h3>{t('listing.contact_owner') || 'Contacter le propriétaire'}</h3>
              <div className="contact-info">
                <FiPhone /> <span>{listing.phone || t('listing.not_provided') || 'Non renseigné'}</span>
              </div>
              
              <a 
                href={`https://wa.me/213${listing.phone?.replace(/^0/, '')}?text=Bonjour, je suis intéressé(e) par votre annonce : ${listing.title}`}
                target="_blank"
                rel="noreferrer"
                className="btn-accent contact-btn whatsapp"
              >
                <FiMessageCircle /> {t('listing.whatsapp')}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingDetails;
