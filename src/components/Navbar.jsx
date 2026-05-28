import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { FiHome, FiSun, FiPlusSquare, FiUser, FiGlobe, FiHeart, FiSearch } from 'react-icons/fi';
import './Navbar.css';

const Navbar = () => {
  const { user } = useAuth();
  const { t, lang, toggleLanguage } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleSearchClick = (e) => {
    e.preventDefault();
    if (location.pathname === '/' || location.pathname === '/leisure') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // Focus search input if it exists after a short delay to allow scroll
      setTimeout(() => {
        const searchInput = document.querySelector('.search-input-container input');
        if (searchInput) searchInput.focus();
      }, 300);
    } else {
      navigate('/');
    }
  };

  return (
    <>
      <header className="navbar-header">
        <div className="container navbar-container">
          <div className="navbar-logo" onClick={() => navigate('/')}>
            <span className="logo-dk">DK</span>
            <span className="logo-text">Darkoum</span>
          </div>

          <nav className="navbar-links">
            <Link to="/" className={`nav-link ${isActive('/') && location.pathname === '/' ? 'active' : ''}`}>
              {t('nav.home')}
            </Link>
            <Link to="/leisure" className={`nav-link ${isActive('/leisure') ? 'active' : ''}`}>
              {t('nav.leisure')}
            </Link>
            <Link to="/favorites" className={`nav-link ${isActive('/favorites') ? 'active' : ''}`}>
              {t('nav.favorites') || 'Favoris'}
            </Link>
          </nav>

          <div className="navbar-actions">
            <button onClick={handleSearchClick} className="mobile-search-btn" aria-label="Search">
              <FiSearch size={20} />
            </button>

            <button className="lang-toggle" onClick={toggleLanguage} aria-label="Toggle language">
              <FiGlobe size={16} /> {lang === 'fr' ? 'عربي' : 'FR'}
            </button>

            {user ? (
              <>
                <Link to="/post" className="btn-accent nav-post-btn desktop-only" style={{ padding: '8px 16px', borderRadius: 'var(--radius-pill)', fontSize: '0.9rem' }}>
                  <FiPlusSquare /> {t('nav.post')}
                </Link>
                <Link to="/dashboard" className="nav-user desktop-only">
                  <FiUser /> {t('nav.dashboard')}
                </Link>
              </>
            ) : (
              <Link to="/login" className="nav-link desktop-only">
                <FiUser /> {t('nav.login')}
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-bottom-nav">
        <Link to="/" className={`mobile-nav-item ${isActive('/') && location.pathname === '/' ? 'active' : ''}`}>
          <FiHome />
          <span>{t('nav.home')}</span>
        </Link>
        <Link to="/leisure" className={`mobile-nav-item ${isActive('/leisure') ? 'active' : ''}`}>
          <FiSun />
          <span>{t('nav.leisure')}</span>
        </Link>
        {user && (
          <Link to="/post" className={`mobile-nav-item mobile-post-btn ${isActive('/post') ? 'active' : ''}`}>
            <FiPlusSquare />
            <span>{t('nav.post')}</span>
          </Link>
        )}
        <Link to="/favorites" className={`mobile-nav-item ${isActive('/favorites') ? 'active' : ''}`}>
          <FiHeart />
          <span>{t('nav.favorites') || 'Favoris'}</span>
        </Link>
        <Link to={user ? "/dashboard" : "/login"} className={`mobile-nav-item ${isActive('/dashboard') || isActive('/login') ? 'active' : ''}`}>
          <FiUser />
          <span>{user ? t('nav.dashboard') : t('nav.login')}</span>
        </Link>
      </nav>
    </>
  );
};

export default Navbar;
