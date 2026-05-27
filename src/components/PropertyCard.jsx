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
          {isNew && <div className="badge-new-dot" title={t('listing.new')}></div>}
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

        <h3 className="card-title" style={{ fontSize: '1.25rem', marginBottom: '8px', color: '#111827' }}>{listing.title}</h3>
        
        <div className="card-price" style={{ fontSize: '1.1rem', color: 'var(--primary-color)', fontWeight: 'bold', marginBottom: '12px' }}>
          {formatPrice(listing.price, lang)} 
          {listing.priceUnit && listing.priceUnit !== 'total' && (
            <span className="price-unit" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginLeft: '4px' }}>
              {listing.priceUnit === 'per-month' ? t('listing.per_month') : 
               listing.priceUnit === 'per-night' ? t('listing.per_night') : 
               listing.priceUnit === 'per-week' ? t('listing.per_week') : ''}
            </span>
          )}
        </div>
        
        <div className="card-location">
          <FiMapPin /> {listing.city}
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto' }}>
          <div className="card-specs" style={{ margin: 0 }}>
            {listing.rooms > 0 && <span className="spec-item">🛏 {listing.rooms}</span>}
            {listing.bathrooms > 0 && <span className="spec-item">🚿 {listing.bathrooms}</span>}
            {listing.surface > 0 && <span className="spec-item">📐 {listing.surface}</span>}
          </div>
          
          <div style={{ transform: 'scale(0.85)', transformOrigin: 'bottom right' }}>
            {listing.category === 'leisure' ? (
              <Badge type="verified">{t('nav.leisure')}</Badge>
            ) : listing.transactionType === 'buy' ? (
              <Badge type="featured">{t('home.buy')}</Badge>
            ) : (
              <Badge type="rent">{t('home.rent')}</Badge>
            )}
          </div>
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
