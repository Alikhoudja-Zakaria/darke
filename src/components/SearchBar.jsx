import React, { useState, useEffect, useRef } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';
import { wilayas } from '../data/cities';
import { useLanguage } from '../context/LanguageContext';
import './SearchBar.css';

const SearchBar = ({ onSearch }) => {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    
    if (value.trim().length > 0) {
      const filtered = wilayas.filter(city => 
        city.name.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 5);
      setSuggestions(filtered);
      setIsOpen(true);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  };

  const handleSelect = (city) => {
    setQuery(city.name);
    setIsOpen(false);
    onSearch(city.name);
    
    // Save to recent searches
    const recent = JSON.parse(localStorage.getItem('dk_recent_searches') || '[]');
    const newRecent = [city.name, ...recent.filter(r => r !== city.name)].slice(0, 5);
    localStorage.setItem('dk_recent_searches', JSON.stringify(newRecent));
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    onSearch('');
  };

  return (
    <div className="search-bar-wrapper" ref={wrapperRef}>
      <div className="search-input-container">
        <FiSearch className="search-icon" />
        <input
          type="text"
          className="search-input"
          placeholder={t('nav.search')}
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (query.trim().length === 0) {
              const recent = JSON.parse(localStorage.getItem('dk_recent_searches') || '[]');
              if (recent.length > 0) {
                setSuggestions(recent.map((name, idx) => ({ id: `recent-${idx}`, name, isRecent: true })));
                setIsOpen(true);
              }
            }
          }}
        />
        {query && (
          <button className="search-clear-btn" onClick={handleClear}>
            <FiX />
          </button>
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <ul className="search-suggestions">
          {suggestions.map((suggestion) => (
            <li 
              key={suggestion.id} 
              className="suggestion-item"
              onClick={() => handleSelect(suggestion)}
            >
              <FiSearch className="suggestion-icon" />
              <span className="suggestion-text">{suggestion.name}</span>
              {suggestion.isRecent && <span className="suggestion-badge">Récent</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SearchBar;
