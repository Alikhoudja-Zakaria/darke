import { memo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiHeart, FiMapPin } from 'react-icons/fi';
import { useLanguage } from '../context/LanguageContext';
import { useFavorites } from '../hooks/useFavorites';
import { formatPrice, formatPriceCentimes } from '../utils/formatPrice';
import { getCityDisplayName } from '../utils/cityUtils';
import Badge from './Badge';
import ImageCarousel from './ImageCarousel';
import './PropertyCard.css';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

const PropertyCard = ({ listing, renderActions }) => {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorite = isFavorite(listing.id);

  const [isNew, setIsNew] = useState(false);

  useEffect(() => {
    if (!listing.createdAt) return;
    const createdAtTime = listing.createdAt?.seconds 
      ? listing.createdAt.seconds * 1000 
      : new Date(listing.createdAt).getTime();
    setIsNew(createdAtTime ? (Date.now() - createdAtTime) < SEVEN_DAYS_MS : false);
  }, [listing.createdAt]);
  
  const handleFavoriteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(listing.id);
  };

  const handleCardClick = (e) => {
    // If clicking a button, input, or carousel control, don't navigate
    if (e.target.closest('button') || e.target.closest('.card-actions') || e.target.closest('.swiper-button-prev') || e.target.closest('.swiper-button-next')) {
      return;
    }
    navigate(`/listing/${listing.id}`);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      if (!e.target.closest('button')) {
        e.preventDefault();
        navigate(`/listing/${listing.id}`);
      }
    }
  };

  return (
    <div 
      className="card property-card" 
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="link"
      style={{ textDecoration: 'none', color: 'inherit', display: 'block', position: 'relative', cursor: 'pointer' }}
    >
      <div className="card-image-wrapper">
        <ImageCarousel images={listing.images?.slice(0, 6)} />
        
        <div className="card-badges-top">
          {isNew && <div className="badge-new-dot" title={t('listing.new')}></div>}
        </div>
        
        <button 
          type="button"
          className={`card-favorite-btn ${favorite ? 'active' : ''}`}
          onClick={handleFavoriteClick}
          aria-label="Save to favorites"
        >
          <FiHeart className={favorite ? 'heart-filled' : ''} />
        </button>
      </div>

      <div className="card-content">

        <h3 className="card-title">{listing.title}</h3>
        
        <div className="card-price">
          {formatPrice(listing.price, lang)} 
          {listing.priceUnit && listing.priceUnit !== 'total' && (
            <span className="price-unit" style={{ marginInlineStart: '4px' }}>
              {listing.priceUnit === 'per-month' ? t('listing.per_month') : 
               listing.priceUnit === 'per-night' ? t('listing.per_night') : 
               listing.priceUnit === 'per-week' ? t('listing.per_week') : ''}
            </span>
          )}
          {formatPriceCentimes(listing.price, lang) && (
            <div className="price-centimes">
              ≈ {formatPriceCentimes(listing.price, lang)}
            </div>
          )}
        </div>
        
        <div className="card-location">
          <FiMapPin /> {getCityDisplayName(listing.city, lang)}
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto' }}>
          <div className="card-specs">
            {listing.rooms > 0 && <span className="spec-item">🛏 {listing.rooms}</span>}
            {listing.bathrooms > 0 && <span className="spec-item">🚿 {listing.bathrooms}</span>}
            {listing.surface > 0 && <span className="spec-item">📐 {listing.surface} m²</span>}
          </div>
          
          <div style={{ transform: 'scale(0.85)', transformOrigin: lang === 'ar' ? 'bottom left' : 'bottom right' }}>
            {listing.category === 'leisure' || listing.priceUnit === 'per-night' ? (
              <Badge type="verified">{t('nav.leisure')}</Badge>
            ) : (listing.transactionType === 'buy' || listing.transactionType === 'sale' || listing.priceUnit === 'total') ? (
              <Badge type="featured">{t('home.buy') || 'Acheter'}</Badge>
            ) : (
              <Badge type="rent">{t('home.rent') || 'Louer'}</Badge>
            )}
          </div>
        </div>
        
        {renderActions && (
          <div className="card-actions" onClick={(e) => e.stopPropagation()}>
            {renderActions(listing)}
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(PropertyCard);
