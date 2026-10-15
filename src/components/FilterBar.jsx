import { useState } from 'react';
import { FiFilter, FiChevronDown } from 'react-icons/fi';
import { useLanguage } from '../context/LanguageContext';
import { wilayas } from '../data/cities';
import './FilterBar.css';

const FilterBar = ({ onFilterChange, forceLeisureMode }) => {
  const { t, lang } = useLanguage();
  const [showMore, setShowMore] = useState(false);
  const [filters, setFilters] = useState({
    city: '',
    propertyType: '',
    minPrice: '',
    maxPrice: '',
    rooms: '',
    furnished: ''
  });

  const handleChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const resetFilters = () => {
    const empty = {
      city: '', propertyType: '', minPrice: '', maxPrice: '', rooms: '', furnished: '', transactionType: 'all'
    };
    setFilters(empty);
    onFilterChange(empty);
  };

  const activeCount = Object.entries(filters).filter(([key, val]) => {
    if (key === 'transactionType') return val && val !== 'all';
    return val !== '' && val !== undefined && val !== null;
  }).length;

  return (
    <div className="filter-bar">
      {!forceLeisureMode && (
        <div className="filter-transaction-type">
          <button 
            className={`filter-type-btn ${(!filters.transactionType || filters.transactionType === 'all') ? 'active' : ''}`}
            onClick={() => handleChange('transactionType', 'all')}
          >
            {t('filters.all') || 'Tout'}
          </button>
          <button 
            className={`filter-type-btn ${filters.transactionType === 'buy' ? 'active' : ''}`}
            onClick={() => handleChange('transactionType', 'buy')}
          >
            {t('home.buy') || 'Acheter'}
          </button>
          <button 
            className={`filter-type-btn ${filters.transactionType === 'rent' ? 'active' : ''}`}
            onClick={() => handleChange('transactionType', 'rent')}
          >
            {t('home.rent') || 'Louer'}
          </button>
        </div>
      )}

      <div className="filter-main" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
        <button 
          className="btn-filter-toggle" 
          onClick={() => setShowMore(!showMore)}
          style={{ width: '100%', maxWidth: '300px', justifyContent: 'center', position: 'relative' }}
        >
          <FiFilter /> 
          <span>{showMore ? (t('filters.hide') || 'Masquer les filtres') : (t('filters.more_filters') || 'Plus de filtres')}</span>
          {activeCount > 0 && (
            <span style={{ 
              backgroundColor: 'var(--primary-color)', 
              color: 'white', 
              borderRadius: '9999px', 
              padding: '2px 8px', 
              fontSize: '0.75rem', 
              fontWeight: 700,
              marginLeft: '6px'
            }}>
              {activeCount}
            </span>
          )}
          <FiChevronDown className={showMore ? 'rotate' : ''} />
        </button>

        {activeCount > 0 && (
          <button
            type="button"
            onClick={resetFilters}
            className="btn-outline"
            style={{ padding: '8px 14px', borderRadius: 'var(--radius-pill)', fontSize: '0.85rem', color: '#DC2626', borderColor: '#FCA5A5' }}
            title={t('filters.reset') || 'Effacer les filtres'}
          >
            {t('filters.reset') || 'Effacer'}
          </button>
        )}
      </div>

      {showMore && (
        <div className="filter-expanded">
          <select 
            className="filter-select"
            value={filters.city}
            aria-label={t('filters.city') || 'Ville'}
            onChange={(e) => handleChange('city', e.target.value)}
          >
            <option value="">{t('filters.city')}</option>
            {wilayas.map(city => (
              <option key={city.id} value={city.name}>
                {city.code} - {lang === 'ar' && city.nameAr ? city.nameAr : city.name}
              </option>
            ))}
          </select>

          <select 
            className="filter-select"
            value={filters.propertyType}
            onChange={(e) => handleChange('propertyType', e.target.value)}
          >
            <option value="">{t('filters.property_type')}</option>
            <option value="apartment">{t('property_types.apartment')}</option>
            <option value="house">{t('property_types.house')}</option>
            <option value="villa">{t('property_types.villa')}</option>
            <option value="studio">{t('property_types.studio')}</option>
            <option value="commercial">{t('property_types.commercial')}</option>
            <option value="land">{t('property_types.land')}</option>
          </select>

          <div className="filter-price-group">
            <input 
              type="number" 
              placeholder="Min DA" 
              className="filter-input"
              value={filters.minPrice}
              onChange={(e) => handleChange('minPrice', e.target.value)}
            />
            <span>-</span>
            <input 
              type="number" 
              placeholder="Max DA" 
              className="filter-input"
              value={filters.maxPrice}
              onChange={(e) => handleChange('maxPrice', e.target.value)}
            />
          </div>
          <select 
            className="filter-select"
            value={filters.rooms}
            onChange={(e) => handleChange('rooms', e.target.value)}
          >
            <option value="">{t('filters.rooms')}</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4+</option>
          </select>

          <select 
            className="filter-select"
            value={filters.furnished}
            onChange={(e) => handleChange('furnished', e.target.value)}
          >
            <option value="">{t('filters.furnished')}</option>
            <option value="true">{t('misc.yes')}</option>
            <option value="false">{t('misc.no')}</option>
          </select>

          <button className="btn-reset" onClick={resetFilters}>
            {t('filters.reset')}
          </button>
        </div>
      )}
    </div>
  );
};

export default FilterBar;
