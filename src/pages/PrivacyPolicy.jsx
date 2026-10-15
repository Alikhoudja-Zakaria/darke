import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { FiShield, FiCheckCircle, FiLock, FiMail, FiFileText } from 'react-icons/fi';
import './LegalPages.css';

const PrivacyPolicy = () => {
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
            <FiShield size={14} />
            <span>{isAr ? 'متوافق مع القانون رقم 18-07 لحماية البيانات' : 'Conforme à la Loi n° 18-07 du 10 juin 2018'}</span>
          </div>
          <h1 className="legal-title">
            {isAr ? 'سياسة الخصوصية وحماية المعطيات الشخصية' : 'Politique de Confidentialité & Protection des Données'}
          </h1>
          <p className="legal-subtitle">
            {isAr
              ? 'تلتزم منصة داركم بحماية خصوصيتك ومعالجة بياناتك الشخصية بشفافية وأمان وفق التشريعات الجزائرية السارية.'
              : 'Darkoum s\'engage à protéger la vie privée de ses utilisateurs et à traiter leurs données personnelles avec la plus grande rigueur, en conformité avec la réglementation algérienne.'}
          </p>
          <div className="legal-meta">
            <span>📅 {isAr ? 'تاريخ التحديث: أكتوبر 2026' : 'Dernière mise à jour : Octobre 2026'}</span>
            <span>📍 {isAr ? 'الجزائر العاصمة، الجمهورية الجزائرية الديمقراطية الشعبية' : 'Alger, République Algérienne Démocratique et Populaire'}</span>
          </div>
        </div>

        <div className="legal-grid">
          {/* Table of contents navigation */}
          <aside className="legal-nav-card">
            <div className="legal-nav-title">
              {isAr ? 'أقسام السياسة' : 'Sommaire'}
            </div>
            <ul className="legal-nav-links">
              <li><a href="#loi-18-07">{isAr ? '1. الإطار القانوني (قانون 18-07)' : '1. Cadre Légal (Loi 18-07)'}</a></li>
              <li><a href="#donnees-collectees">{isAr ? '2. البيانات المجمعة' : '2. Données collectées'}</a></li>
              <li><a href="#finalites">{isAr ? '3. أهداف معالجة البيانات' : '3. Finalités du traitement'}</a></li>
              <li><a href="#ouedkniss-notice">{isAr ? '4. الإعلانات العامة وحق الحذف' : '4. Annonces publiques & Droit de retrait'}</a></li>
              <li><a href="#droits-utilisateurs">{isAr ? '5. حقوقك وطرق ممارستها' : '5. Vos droits légaux'}</a></li>
              <li><a href="#securite">{isAr ? '6. الأمان والاستضافة' : '6. Sécurité & Hébergement'}</a></li>
              <li><a href="#contact-dpo">{isAr ? '7. الاتصال ومسؤول الحماية' : '7. Contact & Réclamations'}</a></li>
            </ul>
          </aside>

          {/* Detailed Legal Content */}
          <main className="legal-content-card">
            <section id="loi-18-07" className="legal-section">
              <h2><FiLock /> {isAr ? '1. الإطار القانوني الجزائري (القانون 18-07)' : '1. Cadre Légal Algérien (Loi 18-07)'}</h2>
              <p>
                {isAr
                  ? 'تخضع معالجة البيانات الشخصية على منصة داركم (Darkoum) لأحكام القانون رقم 18-07 المؤرخ في 10 جوان 2018 المتعلق بحماية الأشخاص الطبيعيين في مجال معالجة المعطيات ذات الطابع الشخصي، الصادر في الجريدة الرسمية للجمهورية الجزائرية الديمقراطية الشعبية.'
                  : 'Le traitement des données à caractère personnel effectué sur la plateforme Darkoum est soumis aux dispositions de la Loi n° 18-07 du 10 juin 2018 relative à la protection des personnes physiques dans le traitement des données à caractère personnel, publiée au Journal Officiel de la République Algérienne Démocratique et Populaire.'}
              </p>
              <div className="legal-highlight-box">
                <p>
                  {isAr
                    ? 'نحن نضمن أن معالجة بياناتك تتم بصفة مشروعة ونزيهة وشفافة، ولأغراض محددة وصريحة ترتبط حصرياً بخدمات الوساطة العقارية والإعلانات.'
                    : 'Nous garantissons que le traitement de vos données s\'effectue de façon loyale, licite et transparente, pour des finalités déterminées et légitimes liées aux services de recherche et publication immobilière.'}
                </p>
              </div>
            </section>

            <section id="donnees-collectees" className="legal-section">
              <h2><FiFileText /> {isAr ? '2. البيانات التي نقوم بجمعها' : '2. Données que nous collectons'}</h2>
              <p>
                {isAr
                  ? 'نقوم بجمع الحد الأدنى الضروري من البيانات لتقديم خدمة عالية الجودة وتسهيل التواصل بين البائعين والمشترين أو المكترين:'
                  : 'Nous appliquons le principe de minimisation des données. Seules les informations strictement nécessaires au bon fonctionnement de la plateforme sont collectées :'}
              </p>
              <ul>
                <li>
                  <strong>{isAr ? 'بيانات الحساب الشخصي: ' : 'Données d\'identification : '}</strong>
                  {isAr ? 'الاسم، البريد الإلكتروني، ورقم الهاتف عند التسجيل أو إضافة إعلان.' : 'Nom, adresse email et numéro de téléphone lors de la création de compte ou dépôt d\'annonce.'}
                </li>
                <li>
                  <strong>{isAr ? 'بيانات الإعلانات العقارية: ' : 'Données relatives aux annonces : '}</strong>
                  {isAr ? 'عنوان العقار، المدينة، الولاية، السعر بالدينار الجزائري، الصور، والمواصفات.' : 'Titre du bien, wilaya, commune, prix en Dinar Algérien (DZD), photos et caractéristiques techniques.'}
                </li>
                <li>
                  <strong>{isAr ? 'بيانات التصفح التقنية: ' : 'Données techniques de navigation : '}</strong>
                  {isAr ? 'عنوان IP، سجل البحث، وتفضيلات اللغة المحفوظة محلياً (localStorage).' : 'Adresse IP, préférences de recherche et choix de langue enregistrés localement dans votre navigateur.'}
                </li>
              </ul>
            </section>

            <section id="finalites" className="legal-section">
              <h2><FiCheckCircle /> {isAr ? '3. أهداف معالجة البيانات' : '3. Finalités du traitement'}</h2>
              <p>{isAr ? 'تُستخدم بياناتك للأغراض المحددة التالية:' : 'Vos informations sont exploitées exclusivement pour les objectifs suivants :'}</p>
              <ul>
                <li>{isAr ? 'تمكين الزوار من الاتصال بك مباشرة عبر الهاتف أو واتساب بخصوص عقارك.' : 'Permettre la mise en relation directe par appel téléphonique ou WhatsApp entre acheteurs/locataires et propriétaires.'}</li>
                <li>{isAr ? 'إدارة وتحديث إعلاناتك عبر فضاء المستخدم الخاص بك.' : 'Gérer, modifier ou archiver vos annonces depuis votre espace personnel.'}</li>
                <li>{isAr ? 'حماية المنصة من الاحتيال، الإعلانات الوهمية والرسائل المزعجة.' : 'Prévenir la fraude, les fausses annonces et garantir la sécurité des utilisateurs.'}</li>
                <li>{isAr ? 'تحسين تجربة التصفح وسرعة استجابة الموقع عبر كامل التراب الوطني (58 ولاية).' : 'Optimiser les performances et la recherche d\'annonces à travers les 58 wilayas.'}</li>
              </ul>
            </section>

            <section id="ouedkniss-notice" className="legal-section">
              <h2><FiShield /> {isAr ? '4. الإعلانات العامة وفهرستها وحق الحذف السريع' : '4. Annonces publiques agrégées & Procédure de retrait express'}</h2>
              <p>
                {isAr
                  ? 'تقوم منصة داركم أحياناً بفهرسة وعرض إعلانات عقارية عامة متاحة للعموم على منصات جزائرية رائدة (مثل Ouedkniss) لتسهيل وصول المواطنين للعروض العقارية مع الإشارة دائماً للمصدر الأصلي.'
                  : 'Darkoum agrège et indexe certaines annonces immobilières rendues publiques sur des portails partenaires de référence (notamment Ouedkniss) afin d\'offrir un panorama complet du marché algérien, tout en citant explicitement la source originale.'}
              </p>
              <div className="legal-warning-box">
                <p>
                  {isAr
                    ? '⚠️ هل أنت صاحب إعلان وترغب في تعديله أو حذفه فوراً؟ نلتزم بحذف أي إعلان خلال أقل من 24 ساعة بمجرد طلبك عبر صفحة الاتصال.'
                    : '⚠️ Vous êtes propriétaire d\'un bien ou détenteur des droits et souhaitez le retrait immédiat d\'une annonce ? Nous garantissons un traitement et retrait sous 24 heures ouvrées dès réception de votre demande.'}
                </p>
              </div>
              <Link to="/contact?type=takedown" className="legal-contact-btn">
                <FiMail /> {isAr ? 'طلب حذف أو تعديل إعلان' : 'Formulaire de demande de retrait'}
              </Link>
            </section>

            <section id="droits-utilisateurs" className="legal-section">
              <h2><FiLock /> {isAr ? '5. حقوقك بموجب القانون رقم 18-07' : '5. Vos droits légaux (Loi 18-07)'}</h2>
              <p>
                {isAr
                  ? 'وفقاً لمواد القانون الجزائري رقم 18-07، يحق لكل مستخدم ممارسة الحقوق التالية بكل سهولة وبدون أي مقابل مالي:'
                  : 'Conformément aux articles de la loi algérienne 18-07, tout utilisateur dispose de droits garantis et gratuits sur ses données personnelles :'}
              </p>
              <ul>
                <li><strong>{isAr ? 'حق الاطلاع والولوج: ' : 'Droit d\'accès : '}</strong>{isAr ? 'الحصول على نسخة من بياناتك المسجلة لدينا.' : 'Obtenir la confirmation et la copie des données vous concernant.'}</li>
                <li><strong>{isAr ? 'حق التصحيح والتحيين: ' : 'Droit de rectification : '}</strong>{isAr ? 'تعديل أو تصحيح أي بيانات غير دقيقة.' : 'Corriger ou mettre à jour des informations inexactes ou incomplètes.'}</li>
                <li><strong>{isAr ? 'حق الحذف والنسيان: ' : 'Droit à l\'effacement : '}</strong>{isAr ? 'طلب حذف حسابك وجميع إعلاناتك من قواعد البيانات نهائياً.' : 'Demander la suppression définitive de votre compte et de vos annonces.'}</li>
                <li><strong>{isAr ? 'حق الاعتراض: ' : 'Droit d\'opposition : '}</strong>{isAr ? 'الاعتراض على أي معالجة لا ترغب فيها.' : 'Vous opposer à tout moment au traitement de vos données pour motifs légitimes.'}</li>
              </ul>
            </section>

            <section id="securite" className="legal-section">
              <h2><FiShield /> {isAr ? '6. الأمان وحماية البيانات' : '6. Sécurité & Confidentialité'}</h2>
              <p>
                {isAr
                  ? 'نستخدم بروتوكولات تشفير حديثة (HTTPS / SSL 256-bit) وبنية سحابية آمنة عبر Google Firebase لضمان عدم تسريب بياناتك أو استغلالها من طرف غير مصرح به. لا نقوم إطلاقاً ببيع أو تأجير بيانات مستخدمينا لأي جهة إعلانية خارجية.'
                  : 'Nous appliquons des mesures de sécurité techniques et organisationnelles rigoureuses (chiffrement SSL/TLS 256-bit, règles de sécurité Firestore strictes, authentification sécurisée). Vos coordonnées ne sont jamais vendues, cédées ou louées à des tiers à des fins publicitaires.'}
              </p>
            </section>

            <section id="contact-dpo" className="legal-section">
              <h2><FiMail /> {isAr ? '7. الاتصال بمسؤول حماية البيانات' : '7. Contact & Délégué à la Protection des Données'}</h2>
              <p>
                {isAr
                  ? 'لممارسة أي من حقوقك أو طرح استفسار حول سياسة الخصوصية، يمكنك التواصل معنا مباشرة:'
                  : 'Pour toute demande d\'exercice de vos droits ou question relative au traitement de vos données personnelles :'}
              </p>
              <ul>
                <li><strong>{isAr ? 'البريد الإلكتروني: ' : 'Email dédié : '}</strong>contact@darkoum.dz</li>
                <li><strong>{isAr ? 'الهاتف: ' : 'Téléphone : '}</strong>+213 (0) 550 00 00 00</li>
                <li><strong>{isAr ? 'العنوان: ' : 'Adresse : '}</strong>Alger Centre, 16000 Alger, Algérie</li>
              </ul>
              <Link to="/contact" className="legal-contact-btn">
                <FiMail /> {isAr ? 'مراسلتنا عبر صفحة الاتصال' : 'Formulaire de contact direct'}
              </Link>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
