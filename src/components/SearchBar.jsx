import { useState, useEffect, useRef } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';
import { wilayas } from '../data/cities';
import { useLanguage } from '../context/LanguageContext';
import './SearchBar.css';

const normalizeText = (text) => {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
};

const SearchBar = ({ onSearch }) => {
  const { t, lang } = useLanguage();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const wrapperRef = useRef(null);
  const debounceTimerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);
    
    if (value.trim().length > 0) {
      const normalizedQuery = normalizeText(value);
      const filtered = wilayas.filter(city => {
        const normName = normalizeText(city.name);
        const normAr = normalizeText(city.nameAr || '');
        const code = city.code || '';
        return normName.includes(normalizedQuery) || normAr.includes(normalizedQuery) || code.includes(normalizedQuery);
      }).slice(0, 5);

      setSuggestions(filtered);
      setIsOpen(true);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }

    // Debounce search query update
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      onSearch?.(value);
    }, 180);
  };

  const handleSelect = (city) => {
    const selectedName = lang === 'ar' && city.nameAr ? city.nameAr : city.name;
    setQuery(selectedName);
    setIsOpen(false);
    setSelectedIndex(-1);
    onSearch?.(city.name);
    
    // Save to recent searches
    try {
      const recent = JSON.parse(localStorage.getItem('dk_recent_searches') || '[]');
      const newRecent = [selectedName, ...recent.filter(r => r !== selectedName)].slice(0, 5);
      localStorage.setItem('dk_recent_searches', JSON.stringify(newRecent));
    } catch (err) {
      console.error('Could not save recent search', err);
    }
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setSelectedIndex(-1);
    onSearch?.('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isOpen && selectedIndex >= 0 && suggestions[selectedIndex]) {
      handleSelect(suggestions[selectedIndex]);
      return;
    }
    setIsOpen(false);
    setSelectedIndex(-1);
    onSearch?.(query);

    if (query.trim()) {
      try {
        const recent = JSON.parse(localStorage.getItem('dk_recent_searches') || '[]');
        const newRecent = [query.trim(), ...recent.filter(r => r !== query.trim())].slice(0, 5);
        localStorage.setItem('dk_recent_searches', JSON.stringify(newRecent));
      } catch (err) {
        console.error('Could not save recent search', err);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      if (isOpen && suggestions.length > 0) {
        e.preventDefault();
        setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
      }
    } else if (e.key === 'ArrowUp') {
      if (isOpen && suggestions.length > 0) {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSelectedIndex(-1);
    } else if (e.key === 'Enter') {
      if (isOpen && selectedIndex >= 0 && suggestions[selectedIndex]) {
        e.preventDefault();
        handleSelect(suggestions[selectedIndex]);
        return;
      }
      e.preventDefault();
      setIsOpen(false);
      setSelectedIndex(-1);
      onSearch?.(query);

      if (query.trim()) {
        try {
          const recent = JSON.parse(localStorage.getItem('dk_recent_searches') || '[]');
          const newRecent = [query.trim(), ...recent.filter(r => r !== query.trim())].slice(0, 5);
          localStorage.setItem('dk_recent_searches', JSON.stringify(newRecent));
        } catch (err) {
          console.error('Could not save recent search', err);
        }
      }
    }
  };

  return (
    <div className="search-bar-wrapper" ref={wrapperRef}>
      <form className="search-input-container" onSubmit={handleSubmit}>
        <FiSearch className="search-icon" />
        <input
          type="text"
          className="search-input"
          placeholder={t('nav.search')}
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (query.trim().length === 0) {
              try {
                const recent = JSON.parse(localStorage.getItem('dk_recent_searches') || '[]');
                if (recent.length > 0) {
                  setSuggestions(recent.map((name, idx) => ({ id: `recent-${idx}`, name, isRecent: true })));
                  setIsOpen(true);
                }
              } catch {
                // Ignore storage read error
              }
            }
          }}
        />
        {query && (
          <button type="button" className="search-clear-btn" onClick={handleClear} aria-label="Clear search">
            <FiX />
          </button>
        )}
      </form>

      {isOpen && suggestions.length > 0 && (
        <ul className="search-suggestions">
          {suggestions.map((suggestion, idx) => (
            <li 
              key={suggestion.id} 
              className={`suggestion-item ${selectedIndex === idx ? 'active' : ''}`}
              onClick={() => handleSelect(suggestion)}
            >
              <FiSearch className="suggestion-icon" />
              <span className="suggestion-text">
                {suggestion.isRecent ? suggestion.name : (lang === 'ar' && suggestion.nameAr ? `${suggestion.nameAr} (${suggestion.name})` : suggestion.name)}
              </span>
              {suggestion.isRecent && <span className="suggestion-badge">{t('misc.recent') || 'Récent'}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SearchBar;
