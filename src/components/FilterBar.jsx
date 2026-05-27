import React, { useState } from 'react';
import { FiFilter, FiChevronDown } from 'react-icons/fi';
import { useLanguage } from '../context/LanguageContext';
import { wilayas } from '../data/cities';
import './FilterBar.css';

const FilterBar = ({ onFilterChange, forceLeisureMode }) => {
  const { t } = useLanguage();
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

      <div className="filter-main" style={{ display: 'flex', justifyContent: 'center' }}>
        <button 
          className="btn-filter-toggle" 
          onClick={() => setShowMore(!showMore)}
          style={{ width: '100%', maxWidth: '300px', justifyContent: 'center' }}
        >
          <FiFilter /> {showMore ? t('filters.hide') || 'Masquer les filtres' : t('filters.more_filters') || 'Plus de filtres'} <FiChevronDown className={showMore ? 'rotate' : ''} />
        </button>
      </div>

      {showMore && (
        <div className="filter-expanded" style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <select 
            className="filter-select"
            value={filters.city}
            onChange={(e) => handleChange('city', e.target.value)}
          >
            <option value="">{t('filters.city')}</option>
            {wilayas.map(city => (
              <option key={city.id} value={city.name}>{city.name}</option>
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
