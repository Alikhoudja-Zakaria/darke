import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { FiInfo, FiServer, FiShield, FiMail, FiCpu } from 'react-icons/fi';
import './LegalPages.css';

const LegalNotice = () => {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="legal-page">
      <div className="container">
        <div className="legal-header">
          <div className="legal-badge-pill">
            <FiInfo size={14} />
            <span>{isAr ? 'الإشعار القانوني والناشر' : 'Mentions Légales & Hébergement'}</span>
          </div>
          <h1 className="legal-title">
            {isAr ? 'الإشعارات القانونية لمنصة داركم' : 'Mentions Légales'}
          </h1>
          <p className="legal-subtitle">
            {isAr
              ? 'معلومات عن ناشر المنصة، الاستضافة السحابية، وحقوق الملكية الفكرية المعمول بها في الجزائر.'
              : 'Informations réglementaires concernant l\'éditeur du site, l\'hébergeur d\'infrastructure et les droits de propriété intellectuelle.'}
          </p>
          <div className="legal-meta">
            <span>📅 {isAr ? 'تحديث: 2026' : 'Édition 2026'}</span>
            <span>🇩🇿 Darkoum Immo Algérie</span>
          </div>
        </div>

        <div className="legal-grid">
          <aside className="legal-nav-card">
            <div className="legal-nav-title">
              {isAr ? 'العناوين' : 'Sommaire'}
            </div>
            <ul className="legal-nav-links">
              <li><a href="#editeur">{isAr ? '1. ناشر المنصة' : '1. Éditeur de la plateforme'}</a></li>
              <li><a href="#hebergement">{isAr ? '2. الاستضافة السحابية' : '2. Hébergement'}</a></li>
              <li><a href="#propriete">{isAr ? '3. الملكية الفكرية' : '3. Propriété intellectuelle'}</a></li>
              <li><a href="#signalement">{isAr ? '4. التبليغ وسحب المحتوى' : '4. Notification & Retrait'}</a></li>
            </ul>
          </aside>

          <main className="legal-content-card">
            <section id="editeur" className="legal-section">
              <h2><FiShield /> {isAr ? '1. ناشر الموقع' : '1. Éditeur de la plateforme'}</h2>
              <p>
                {isAr
                  ? 'منصة داركم (Darkoum) هي بوابة إلكترونية مخصصة للإعلانات العقارية عبر مختلف ولايات الجزائر.'
                  : 'Le site Darkoum est une plateforme web et mobile dédiée à la recherche et à la diffusion d\'annonces immobilières en Algérie.'}
              </p>
              <ul>
                <li><strong>{isAr ? 'اسم المنصة: ' : 'Dénomination : '}</strong>Darkoum Immobilier (داركم)</li>
                <li><strong>{isAr ? 'المقر / الاتصال: ' : 'Contact : '}</strong>contact@darkoum.dz</li>
                <li><strong>{isAr ? 'الموقع الجغرافي: ' : 'Localisation : '}</strong>Alger Centre, 16000 Alger, Algérie</li>
                <li><strong>{isAr ? 'النشاط: ' : 'Activité : '}</strong>{isAr ? 'خدمات الوساطة الرقمية وبوابة إعلانات عقارية' : 'Services d\'intermédiation numérique et portail de petites annonces immobilières'}</li>
              </ul>
            </section>

            <section id="hebergement" className="legal-section">
              <h2><FiServer /> {isAr ? '2. الاستضافة الفنية والبنية السحابية' : '2. Hébergement & Infrastructure Cloud'}</h2>
              <p>
                {isAr
                  ? 'يتم استضافة قاعدة بيانات المنصة ومحتوياتها على البنية السحابية الآمنة لـ Google Firebase:'
                  : 'L\'infrastructure applicative et la base de données sécurisée de Darkoum sont hébergées par Google Cloud Platform / Firebase :'}
              </p>
              <ul>
                <li><strong>{isAr ? 'المستضيف: ' : 'Prestataire d\'hébergement : '}</strong>Google LLC / Firebase</li>
                <li><strong>{isAr ? 'العنوان: ' : 'Adresse du siège : '}</strong>1600 Amphitheatre Parkway, Mountain View, CA 94043, USA</li>
                <li><strong>{isAr ? 'الأمان: ' : 'Standard de sécurité : '}</strong>Chiffrement TLS 1.3 / Certificat SSL sécurisé</li>
              </ul>
            </section>

            <section id="propriete" className="legal-section">
              <h2><FiCpu /> {isAr ? '3. الملكية الفكرية' : '3. Propriété intellectuelle'}</h2>
              <p>
                {isAr
                  ? 'تعد العلامة التجارية Darkoum، وتصميم الواجهة، والشعار، والشفرات البرمجية ملكاً حصرياً لمطوري المنصة. يُمنع استنساخ التصميم أو الهندسة البرمجية بدون ترخيص كتابي مسبق.'
                  : 'La marque Darkoum, l\'identité graphique, la charte de couleurs, le code source et les interfaces utilisateurs constituent des œuvres de l\'esprit protégées par les législations algériennes et internationales relatives à la propriété intellectuelle. Toute reproduction non autorisée est strictement interdite.'}
              </p>
            </section>

            <section id="signalement" className="legal-section">
              <h2><FiMail /> {isAr ? '4. إجراءات التبليغ وحذف المحتوى غير القانوني' : '4. Procédure de signalement & Retrait de contenu'}</h2>
              <p>
                {isAr
                  ? 'تلتزم داركم بصفتها وسيطاً تقنياً بالتعامل الفوري مع أي إشعار بمحتوى غير قانوني، أو خرق لحقوق الملكية أو رغبة صاحب عقار في سحب إعلانه. بمجرد التبليغ، يُسحب المحتوى في أجل أقصاه 24 ساعة.'
                  : 'En qualité d\'hébergeur technique, Darkoum met à la disposition de tout tiers ou titulaire de droits une procédure rapide permettant de signaler tout contenu frauduleux ou de demander le déréférencement d\'un bien sous 24 heures.'}
              </p>
              <div className="legal-highlight-box">
                <p>
                  {isAr
                    ? 'لتقديم طلب سحب إعلان، يرجى تزويدنا برابط أو رقم الإعلان عبر النموذج المخصص.'
                    : 'Pour initier un retrait, transmettez l\'identifiant de l\'annonce ou son lien direct via notre formulaire de contact.'}
                </p>
              </div>
              <Link to="/contact?type=takedown" className="legal-contact-btn">
                <FiMail /> {isAr ? 'إرسال تبليغ أو طلب سحب' : 'Formulaire de signalement & retrait'}
              </Link>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
};

export default LegalNotice;
