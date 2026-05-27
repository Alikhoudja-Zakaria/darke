import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { FiHome, FiSun, FiPlusSquare, FiUser, FiGlobe, FiHeart } from 'react-icons/fi';
import './Navbar.css';

const Navbar = () => {
  const { user } = useAuth();
  const { t, lang, toggleLanguage } = useLanguage();
  const navigate = useNavigate();

  return (
    <>
      <header className="navbar-header">
        <div className="container navbar-container">
        <div className="navbar-logo" onClick={() => navigate('/')}>
          <span className="logo-dk">DK</span>
          <span className="logo-text">Darkoum</span>
        </div>

        <nav className="navbar-links">
          <Link to="/" className="nav-link">
            <FiHome /> {t('nav.home')}
          </Link>
          <Link to="/leisure" className="nav-link">
            <FiSun /> {t('nav.leisure')}
          </Link>
        </nav>

        <div className="navbar-actions">
          <button className="lang-toggle" onClick={toggleLanguage}>
            <FiGlobe /> {lang === 'fr' ? 'AR' : 'FR'}
          </button>
          
          <Link to="/favorites" className="nav-link" style={{ padding: '8px' }}>
            <FiHeart size={20} />
          </Link>

          {user ? (
            <>
              <Link to="/post" className="btn-accent nav-post-btn">
                <FiPlusSquare /> {t('nav.post')}
              </Link>
              <Link to="/dashboard" className="nav-user">
                <FiUser /> {t('nav.dashboard')}
              </Link>
            </>
          ) : (
            <Link to="/login" className="btn-primary">
              <FiUser /> {t('nav.login')}
            </Link>
          )}
        </div>
      </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-bottom-nav">
        <Link to="/" className="mobile-nav-item">
          <FiHome />
          <span>{t('nav.home')}</span>
        </Link>
        <Link to="/leisure" className="mobile-nav-item">
          <FiSun />
          <span>{t('nav.leisure')}</span>
        </Link>
        <Link to="/favorites" className="mobile-nav-item">
          <FiHeart />
          <span>{t('nav.favorites') || 'Favoris'}</span>
        </Link>
        {user && (
          <Link to="/post" className="mobile-nav-item mobile-post-btn">
            <FiPlusSquare />
            <span>{t('nav.post')}</span>
          </Link>
        )}
        {user ? (
          <Link to="/dashboard" className="mobile-nav-item">
            <FiUser />
            <span>{t('nav.dashboard')}</span>
          </Link>
        ) : (
          <Link to="/login" className="mobile-nav-item">
            <FiUser />
            <span>{t('nav.login')}</span>
          </Link>
        )}
      </nav>
    </>
  );
};

export default Navbar;
