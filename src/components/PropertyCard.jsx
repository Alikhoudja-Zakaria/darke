import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiHeart, FiMapPin } from 'react-icons/fi';
import { useLanguage } from '../context/LanguageContext';
import { useFavorites } from '../hooks/useFavorites';
import { formatPrice } from '../utils/formatPrice';
import Badge from './Badge';
import ImageCarousel from './ImageCarousel';
import './PropertyCard.css';

const PropertyCard = ({ listing, renderActions }) => {
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorite = isFavorite(listing.id);

  // Determine badges
  const createdAtTime = listing.createdAt?.seconds 
    ? listing.createdAt.seconds * 1000 
    : new Date(listing.createdAt).getTime();
  const isNew = createdAtTime ? (Date.now() - createdAtTime) < 7 * 24 * 60 * 60 * 1000 : false;
  
  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    toggleFavorite(listing.id);
  };

  return (
    <div className="card property-card" onClick={() => navigate(`/listing/${listing.id}`)}>
      <div className="card-image-wrapper">
        <ImageCarousel images={listing.images} />
        
        <div className="card-badges-top">
          {isNew && <Badge type="new">{t('listing.new')}</Badge>}
          {listing.category === 'leisure' ? (
            <Badge type="verified">{t('nav.leisure')}</Badge>
          ) : (
            <Badge type="featured">{listing.transactionType === 'buy' ? t('home.buy') : t('home.rent')}</Badge>
          )}
        </div>
        
        <button 
          className={`card-favorite-btn ${favorite ? 'active' : ''}`}
          onClick={handleFavoriteClick}
          aria-label="Save to favorites"
        >
          <FiHeart className={favorite ? 'heart-filled' : ''} />
        </button>
      </div>

      <div className="card-content">
        <div className="card-price">
          {formatPrice(listing.price, lang)} 
          {listing.priceUnit && listing.priceUnit !== 'total' && (
            <span className="price-unit">
              {listing.priceUnit === 'per-month' ? t('listing.per_month') : 
               listing.priceUnit === 'per-night' ? t('listing.per_night') : 
               listing.priceUnit === 'per-week' ? t('listing.per_week') : ''}
            </span>
          )}
        </div>
        
        <h3 className="card-title">{listing.title}</h3>
        
        <div className="card-location">
          <FiMapPin /> {listing.city}
        </div>
        
        <div className="card-specs">
          {listing.rooms > 0 && <span className="spec-item">🛏 {listing.rooms} {t('listing.rooms')}</span>}
          {listing.bathrooms > 0 && <span className="spec-item">🚿 {listing.bathrooms} {t('listing.baths')}</span>}
          {listing.surface > 0 && <span className="spec-item">📐 {listing.surface} {t('listing.surface')}</span>}
        </div>
        
        {renderActions && (
          <div className="card-actions" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #E5E7EB', display: 'flex', gap: '8px' }}>
            {renderActions(listing)}
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertyCard;
