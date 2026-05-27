import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import './Login.css';

const Login = () => {
  const { t } = useLanguage();
  const { login, register } = useAuth();
  const navigate = useNavigate();
  
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
        // Basic phone validation for Algeria (starts with 0, 10 digits)
        const phoneRegex = /^0\d{9}$/;
        if (!phoneRegex.test(formData.phone)) {
          throw new Error("Format de téléphone invalide. Ex: 0555123456");
        }
        await register(formData.email, formData.password, formData.name, formData.phone);
      }
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError(err.message || "Une erreur est survenue.");
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
              required
            />
          </div>

          <div className="form-group">
            <label className="label">{t('auth.password')}</label>
            <input 
              type="password" 
              name="password"
              className="input-field" 
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

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
