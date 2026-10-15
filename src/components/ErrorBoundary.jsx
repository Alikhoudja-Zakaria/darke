import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Uncaught application error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const isAr = (typeof window !== 'undefined' && localStorage.getItem('dk_lang') === 'ar');

      return (
        <div style={{
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
          textAlign: 'center'
        }} dir={isAr ? 'rtl' : 'ltr'}>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '12px', color: '#111827' }}>
            {isAr ? 'حدث خطأ غير متوقع' : 'Une erreur inattendue est survenue'}
          </h2>
          <p style={{ color: '#6B7280', marginBottom: '24px', maxWidth: '480px' }}>
            {isAr 
              ? 'واجه التطبيق مشكلة غير متوقعة. يرجى تحديث الصفحة أو العودة إلى الصفحة الرئيسية.' 
              : "L'application a rencontré un problème. Veuillez rafraîchir la page ou revenir à l'accueil."}
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary"
              style={{ padding: '10px 20px' }}
            >
              {isAr ? 'تحديث' : 'Rafraîchir'}
            </button>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = '/';
              }}
              className="btn-outline"
              style={{ padding: '10px 20px' }}
            >
              {isAr ? 'الرئيسية' : 'Accueil'}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
