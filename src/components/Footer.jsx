import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { FiShield, FiFileText, FiLock, FiMail, FiHome, FiCheck } from 'react-icons/fi';
import './Footer.css';

const Footer = () => {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          {/* Column 1: Brand & Presentation */}
          <div className="footer-col">
            <Link to="/" className="footer-brand" style={{ textDecoration: 'none' }}>
              <span className="logo-dk">dar</span>
              <span>koum</span>
            </Link>
            <p className="footer-about">
              {isAr
                ? 'البوابة العقارية العصرية الأولى في الجزائر. شقق، فيلات، أراضي، وإقامات سياحية عبر 58 ولاية.'
                : 'Le portail immobilier nouvelle génération en Algérie. Vente, location & séjours vacances à travers les 58 wilayas.'}
            </p>
            <div className="footer-badge-dz">
              <span>🇩🇿</span>
              <span>{isAr ? 'مصمم ومطور في الجزائر' : 'Développé pour l\'Algérie'}</span>
            </div>
          </div>

          {/* Column 2: Navigation */}
          <div className="footer-col">
            <div className="footer-heading">
              {isAr ? 'العقارات' : 'Immobilier'}
            </div>
            <ul className="footer-nav">
              <li>
                <Link to="/"><FiHome size={14} /> {isAr ? 'جميع العروض' : 'Toutes les annonces'}</Link>
              </li>
              <li>
                <Link to="/leisure">{isAr ? 'إقامات العطلات' : 'Locations Vacances'}</Link>
              </li>
              <li>
                <Link to="/post">{isAr ? 'نشر إعلان مجاناً' : 'Déposer une annonce'}</Link>
              </li>
              <li>
                <Link to="/favorites">{isAr ? 'المفضلة' : 'Mes Favoris'}</Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Legal & Trust */}
          <div className="footer-col">
            <div className="footer-heading">
              {isAr ? 'القانون والخصوصية' : 'Juridique & Confiance'}
            </div>
            <ul className="footer-nav">
              <li>
                <Link to="/privacy"><FiLock size={14} /> {isAr ? 'سياسة الخصوصية' : 'Politique de Confidentialité'}</Link>
              </li>
              <li>
                <Link to="/terms"><FiFileText size={14} /> {isAr ? 'شروط الاستخدام (CGU)' : 'Conditions d\'Utilisation'}</Link>
              </li>
              <li>
                <Link to="/legal"><FiShield size={14} /> {isAr ? 'الإشعارات القانونية' : 'Mentions Légales'}</Link>
              </li>
              <li>
                <Link to="/contact?type=takedown"><FiMail size={14} /> {isAr ? 'طلب حذف إعلان' : 'Demande de retrait'}</Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact & Support */}
          <div className="footer-col">
            <div className="footer-heading">
              {isAr ? 'المساعدة والاتصال' : 'Support & Contact'}
            </div>
            <ul className="footer-nav">
              <li>
                <Link to="/contact">{isAr ? 'تواصل معنا' : 'Nous contacter'}</Link>
              </li>
              <li>
                <Link to="/contact?type=report">{isAr ? 'الإبلاغ عن إعلان' : 'Signaler un abus'}</Link>
              </li>
              <li>
                <a href="mailto:contact@darkoum.dz">contact@darkoum.dz</a>
              </li>
              <li>
                <span style={{ fontSize: '0.85rem', color: '#64748B' }}>
                  📍 Alger Centre, 16000 Alger
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <div>
            © {new Date().getFullYear()} Darkoum. {isAr ? 'جميع الحقوق محفوظة.' : 'Tous droits réservés.'}
          </div>
          <div className="footer-legal-tag">
            <FiCheck size={14} />
            <span>{isAr ? 'متوافق مع القانون الجزائري رقم 18-07 لحماية المعطيات' : 'Conforme à la Loi 18-07 relative à la protection des données'}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
