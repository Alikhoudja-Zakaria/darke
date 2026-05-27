import React from 'react';
import PropertyCard from './PropertyCard';
import { useLanguage } from '../context/LanguageContext';
import './ListingGrid.css';

const ListingGrid = ({ listings, loading, renderActions }) => {
  const { t } = useLanguage();

  if (loading) {
    return (
      <div className="listing-grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton-card">
            <div className="skeleton-image"></div>
            <div className="skeleton-content">
              <div className="skeleton-line price"></div>
              <div className="skeleton-line title"></div>
              <div className="skeleton-line title short"></div>
              <div className="skeleton-line location"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!listings || listings.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🏠</div>
        <h3>{t('listing.no_results')}</h3>
        <p>{t('listing.try_filters')}</p>
      </div>
    );
  }

  return (
    <div className="listing-grid">
      {listings.map(listing => (
        <PropertyCard key={listing.id} listing={listing} renderActions={renderActions} />
      ))}
    </div>
  );
};

export default ListingGrid;
