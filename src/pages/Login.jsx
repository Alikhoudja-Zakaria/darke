import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { isUserAdmin } from '../utils/adminAuth';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import './Login.css';

const Login = () => {
  const { t } = useLanguage();
  const { user, login, register, logout, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleForgotPassword = async () => {
    if (!formData.email) {
      setError(t('auth.reset_email_prompt'));
      return;
    }
    setError('');
    try {
      await resetPassword(formData.email);
      setResetSent(true);
      setTimeout(() => setResetSent(false), 8000);
    } catch (err) {
      console.error(err);
      setError(t('auth.reset_email_error'));
    }
  };

  useEffect(() => {
    if (user) {
      if (from.startsWith('/admin') && !isUserAdmin(user)) {
        return;
      }
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        if (formData.password !== formData.confirmPassword) {
          throw new Error(t('auth.error_passwords_mismatch') || 'Les mots de passe ne correspondent pas.');
        }
        // Basic phone validation for Algeria (starts with 0, 10 digits)
        const phoneRegex = /^0\d{9}$/;
        if (!phoneRegex.test(formData.phone)) {
          throw new Error(t('auth.invalid_phone') || 'Format de téléphone invalide. Ex: 0555123456');
        }
        await register(formData.email, formData.password, formData.name, formData.phone);
      }
      navigate(from, { replace: true });
    } catch (err) {
      console.error(err);
      let errorMessage = t('auth.error_generic') || 'Une erreur est survenue.';

      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        errorMessage = t('auth.error_invalid_credentials') || 'Email ou mot de passe incorrect.';
      } else if (err.code === 'auth/email-already-in-use') {
        errorMessage = t('auth.error_email_in_use') || 'Cet email est déjà utilisé.';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = t('auth.error_weak_password') || 'Le mot de passe doit faire au moins 6 caractères.';
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container card">
        <h2 className="login-title">
          {isLogin ? t('auth.login_title') : t('auth.register_title')}
        </h2>
        
        {user && !isUserAdmin(user) && (
          <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', padding: '14px 18px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center' }}>
            <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#92400E', lineHeight: 1.4 }}>
              {t('auth.logged_in_as')} <strong>{user.email}</strong>.<br />
              {t('auth.no_admin_privileges')}
            </p>
            <button 
              type="button" 
              className="btn-primary" 
              style={{ backgroundColor: '#DC2626', borderColor: '#DC2626', fontSize: '0.85rem', padding: '6px 14px' }}
              onClick={async () => { await logout(); }}
            >
              {t('auth.switch_account')}
            </button>
          </div>
        )}

        {error && <div className="login-error">{error}</div>}
        
        <form onSubmit={handleSubmit} className="login-form">
          {!isLogin && (
            <>
              <div className="form-group">
                <label className="label">{t('auth.name')}</label>
                <input 
                  type="text" 
                  name="name"
                  className="input-field" 
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="label">{t('auth.phone')}</label>
                <input 
                  type="tel" 
                  name="phone"
                  className="input-field" 
                  placeholder="0555123456"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label className="label">{t('auth.email')}</label>
            <input 
              type="email" 
              name="email"
              className="input-field" 
              value={formData.email}
              onChange={handleChange}
              autoFocus={isLogin}
              required
            />
          </div>

          <div className="form-group">
            <label className="label">{t('auth.password')}</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input 
                type={showPassword ? "text" : "password"} 
                name="password"
                className="input-field" 
                value={formData.password}
                onChange={handleChange}
                style={{ paddingInlineEnd: '42px', width: '100%' }}
                required
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                style={{ position: 'absolute', insetInlineEnd: '12px', color: '#64748B', display: 'flex', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
              >
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
          </div>

          {isLogin && (
            <div style={{ textAlign: 'end', marginTop: '-8px', marginBottom: '16px' }}>
              <button 
                type="button" 
                onClick={handleForgotPassword}
                style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline' }}
              >
                {t('auth.forgot_password')}
              </button>
            </div>
          )}

          {resetSent && (
            <div style={{ background: '#D1FAE5', color: '#065F46', padding: '12px 14px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '18px', lineHeight: 1.4 }}>
              ✓ {t('auth.reset_email_sent')} <strong>{formData.email}</strong>. {t('auth.reset_email_check')}
            </div>
          )}

          {!isLogin && (
            <div className="form-group">
              <label className="label">{t('auth.confirm_password') || 'Confirmer le mot de passe'}</label>
              <input 
                type={showPassword ? "text" : "password"} 
                name="confirmPassword"
                className="input-field" 
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
          )}

          <button type="submit" className="btn-primary login-submit" disabled={loading}>
            {loading ? '...' : (isLogin ? t('auth.login_btn') : t('auth.register_btn'))}
          </button>
        </form>

        <div className="login-toggle">
          <button onClick={() => setIsLogin(!isLogin)} className="btn-link">
            {isLogin ? t('auth.no_account') : t('auth.has_account')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
