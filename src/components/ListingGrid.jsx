import { useState } from 'react';
import PropertyCard from './PropertyCard';
import { useLanguage } from '../context/LanguageContext';
import { FiGrid, FiList } from 'react-icons/fi';
import EmptyState from './EmptyState';
import './ListingGrid.css';

const ListingGrid = ({ listings, loading, renderActions, onResetFilters }) => {
  const { t } = useLanguage();
  const [viewMode, setViewMode] = useState('grid');

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
      <EmptyState
        title={t('listing.no_results') || 'Aucune annonce trouvée'}
        description={t('listing.try_filters') || "Aucune offre ne correspond exactement à vos critères actuels. Élargissez votre recherche ou réinitialisez les filtres."}
        actionLabel={onResetFilters ? (t('filters.reset') || 'Réinitialiser les filtres') : undefined}
        onAction={onResetFilters}
        tip={t('listing.empty_tip') || "Consultez les wilayas voisines (ex: Alger, Blida, Tipaza) ou essayez de chercher sans restriction de prix."}
      />
    );
  }

  return (
    <div className="listing-grid-container">
      <div className="listing-grid-controls">
        <button 
          className="btn-view-toggle"
          onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
        >
          {viewMode === 'grid' ? (
            <><FiList /> {t('misc.better_view') || 'Vue détaillée'}</>
          ) : (
            <><FiGrid /> {t('misc.compact_view') || 'Vue compacte'}</>
          )}
        </button>
      </div>
      <div className={`listing-grid ${viewMode}`}>
        {listings.map(listing => (
          <PropertyCard key={listing.id} listing={listing} renderActions={renderActions} />
        ))}
      </div>
    </div>
  );
};

export default ListingGrid;
