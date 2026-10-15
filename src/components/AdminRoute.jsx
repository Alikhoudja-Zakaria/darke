import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { isUserAdmin } from '../utils/adminAuth';
import { FiLock, FiLogOut, FiArrowLeft, FiArrowRight } from 'react-icons/fi';

const AdminRoute = ({ children }) => {
  const { user, loading, logout } = useAuth();
  const { t, lang } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', flexDirection: 'column', gap: '16px' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid #f3f3f3', borderTop: '3px solid #10B981', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        <p style={{ color: '#6B7280' }}>{t('misc.loading') || 'Chargement...'}</p>
      </div>
    );
  }

  // Not logged in: redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Logged in, but not an admin: show clear information and single-click switch
  if (!isUserAdmin(user)) {
    const handleSwitchAccount = async () => {
      await logout();
      navigate('/login', { state: { from: location } });
    };

    return (
      <div className="container" style={{ padding: '60px 16px', maxWidth: '540px', margin: '0 auto' }}>
        <div className="card" style={{ padding: '36px 28px', textAlign: 'center' }}>
          <div style={{ 
            width: '64px', 
            height: '64px', 
            borderRadius: '50%', 
            backgroundColor: '#FEE2E2', 
            color: '#DC2626', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            margin: '0 auto 20px', 
            fontSize: '28px' 
          }}>
            <FiLock />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>
            {t('auth.no_admin_privileges') || 'Accès Administrateur Restreint'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '16px', lineHeight: 1.5 }}>
            {t('auth.logged_in_as') || 'Vous êtes actuellement connecté avec le compte :'}
          </p>
          <div style={{ 
            background: 'var(--bg-color)', 
            padding: '12px 16px', 
            borderRadius: 'var(--radius-md)', 
            fontWeight: 600, 
            color: 'var(--text-primary)',
            marginBottom: '20px',
            fontSize: '1rem',
            wordBreak: 'break-all'
          }}>
            {user?.email || 'Email non détecté'}
          </div>
          <p style={{ color: '#DC2626', fontSize: '0.85rem', marginBottom: '28px', lineHeight: 1.4 }}>
            {t('auth.no_admin_privileges') || 'Ce compte ne dispose pas des privilèges administrateur.'}
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button 
              type="button" 
              className="btn-outline" 
              onClick={() => navigate('/')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              {lang === 'ar' ? <FiArrowRight /> : <FiArrowLeft />} {t('misc.error_back') || "Retour à l'accueil"}
            </button>
            <button 
              type="button" 
              className="btn-primary" 
              onClick={handleSwitchAccount}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#DC2626', borderColor: '#DC2626' }}
            >
              <FiLogOut /> {t('auth.switch_account') || "Se déconnecter pour changer de compte"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default AdminRoute;
