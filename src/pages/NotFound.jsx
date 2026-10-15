import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const NotFound = () => {
  const { t } = useLanguage();

  return (
    <div className="container" style={{ padding: '100px 20px', textAlign: 'center', minHeight: '60vh' }}>
      <h1 style={{ fontSize: '4rem', color: 'var(--primary-color)', marginBottom: '16px' }}>404</h1>
      <h2 style={{ marginBottom: '16px', color: '#111827' }}>
        {t('misc.not_found') || 'Page introuvable'}
      </h2>
      <p style={{ color: '#6B7280', marginBottom: '24px' }}>
        {t('misc.page_not_found_desc') || "La page que vous recherchez n'existe pas ou a été déplacée."}
      </p>
      <Link to="/" className="btn-primary" style={{ display: 'inline-block', textDecoration: 'none', padding: '12px 24px' }}>
        {t('listing.back') || 'Retour à l\'accueil'}
      </Link>
    </div>
  );
};

export default NotFound;
