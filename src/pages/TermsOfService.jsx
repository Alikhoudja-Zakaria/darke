import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { FiFileText, FiCheckCircle, FiAlertTriangle, FiShield, FiDollarSign } from 'react-icons/fi';
import './LegalPages.css';

const TermsOfService = () => {
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
            <span>{isAr ? 'الشروط العامة للاستخدام (CGU)' : 'Conditions Générales d\'Utilisation'}</span>
          </div>
          <h1 className="legal-title">
            {isAr ? 'شروط وأحكام استخدام منصة داركم' : 'Conditions Générales d\'Utilisation (CGU)'}
          </h1>
          <p className="legal-subtitle">
            {isAr
              ? 'تحدد هذه الشروط القواعد المنظمة لاستخدام منصة داركم العقارية وحقوق وواجبات كل من الزوار والمعلنين.'
              : 'Les présentes conditions régissent l\'accès et l\'utilisation des services de la plateforme immobilière Darkoum en Algérie.'}
          </p>
          <div className="legal-meta">
            <span>📅 {isAr ? 'آخر تحيين: أكتوبر 2026' : 'Dernière mise à jour : Octobre 2026'}</span>
            <span>⚖️ {isAr ? 'تخضع للقانون الجزائري المعمول به' : 'Soumis au Droit Algérien'}</span>
          </div>
        </div>

        <div className="legal-grid">
          <aside className="legal-nav-card">
            <div className="legal-nav-title">
              {isAr ? 'فهرس الشروط' : 'Sommaire'}
            </div>
            <ul className="legal-nav-links">
              <li><a href="#objet">{isAr ? '1. موضوع المنصة' : '1. Objet de la plateforme'}</a></li>
              <li><a href="#qualite-intermediaire">{isAr ? '2. صفة وسيط تقني' : '2. Rôle d\'intermédiaire technique'}</a></li>
              <li><a href="#regles-publication">{isAr ? '3. قواعد نشر الإعلانات' : '3. Règles de publication'}</a></li>
              <li><a href="#prix-monnaie">{isAr ? '4. الأسعار والعملة (دج)' : '4. Prix & Monnaie (DZD)'}</a></li>
              <li><a href="#ouedkniss-cgu">{isAr ? '5. إعلانات المصادر الخارجية' : '5. Contenus tiers & Ouedkniss'}</a></li>
              <li><a href="#responsabilite">{isAr ? '6. حدود المسؤولية' : '6. Limitation de responsabilité'}</a></li>
              <li><a href="#droit-applicable">{isAr ? '7. القانون المعمول به' : '7. Droit applicable & Litiges'}</a></li>
            </ul>
          </aside>

          <main className="legal-content-card">
            <section id="objet" className="legal-section">
              <h2><FiFileText /> {isAr ? '1. موضوع المنصة والقبول بالشروط' : '1. Objet & Acceptation des conditions'}</h2>
              <p>
                {isAr
                  ? 'تهدف منصة داركم (Darkoum) إلى ربط الراغبين في شراء أو كراء العقارات أو حجز إقامات سياحية مع ملاك العقارات والوكلاء المعتمدين في جميع ولايات الجزائر الـ 58. استخدامك للموقع يعني موافقتك التامة على هذه الشروط.'
                  : 'La plateforme Darkoum est un portail de petites annonces immobilières facilitant la mise en relation entre propriétaires, agences et particuliers cherchant à louer, acheter ou réserver un séjour à travers les 58 wilayas d\'Algérie. Toute navigation ou publication implique l\'adhésion sans réserve aux présentes CGU.'}
              </p>
            </section>

            <section id="qualite-intermediaire" className="legal-section">
              <h2><FiShield /> {isAr ? '2. صفة المنصة كوسيط تقني غير متعاقد' : '2. Statut d\'intermédiaire technique'}</h2>
              <p>
                {isAr
                  ? 'داركم هي منصة رقمية وتقنية فقط، وليست وكالة عقارية ولا طرفاً في أي عقد بيع أو إيجار أو دفع أموال بين المستخدمين. تتم جميع المعاملات والاتفاقات المالية خارج المنصة وعلى مسؤولية الأطراف المعنية.'
                  : 'Darkoum agit exclusivement en qualité d\'hébergeur et d\'intermédiaire technique. La plateforme n\'est ni agent immobilier, ni mandataire, ni partie aux contrats de vente ou de bail conclus directement entre vendeurs/bailleurs et acquéreurs/locataires.'}
              </p>
              <div className="legal-warning-box">
                <p>
                  {isAr
                    ? '⚠️ تنبيه أمني: ننصح دائماً بمعاينة العقار حضورياً قبل دفع أي تسبيق أو مستحقات مالية، وعدم إرسال أي أموال عن بُعد دون وثائق رسمية.'
                    : '⚠️ Conseil de sécurité : Nous recommandons vivement de toujours visiter physiquement le bien et de vérifier les actes légaux avant tout versement d\'acompte ou de loyer. Ne réalisez jamais de transfert d\'argent à distance sans garanties vérifiées.'}
                </p>
              </div>
            </section>

            <section id="regles-publication" className="legal-section">
              <h2><FiCheckCircle /> {isAr ? '3. قواعد نشر الإعلانات والمحتوى' : '3. Règles d\'engagement pour la publication'}</h2>
              <p>{isAr ? 'يلتزم كل معلن على منصة داركم بالقواعد الآتية:' : 'Tout utilisateur publiant une offre s\'engage à respecter les obligations suivantes :'}</p>
              <ul>
                <li>{isAr ? 'أن يكون مالكاً شرعياً للعقار أو حاصلاً على تفويض قانوني بنشره.' : 'Être le propriétaire légitime du bien ou détenir un mandat régulier de commercialisation.'}</li>
                <li>{isAr ? 'تقديم معلومات دقيقة وصادقة عن المساحة، الموقع، والسعر الإجمالي.' : 'Fournir des données véridiques concernant la surface, l\'adresse, l\'état du bien et le prix.'}</li>
                <li>{isAr ? 'استخدام صور حقيقية غير مضللة وغير منسوخة بدون إذن.' : 'Publier des photographies authentiques reflétant l\'état réel du logement.'}</li>
                <li>{isAr ? 'الامتناع عن نشر أي محتوى مسيء، مخالف للأخلاق العامة، أو مناف للقوانين الجزائرية.' : 'S\'abstenir de publier tout contenu illicite, frauduleux ou attentatoire aux bonnes mœurs.'}</li>
              </ul>
            </section>

            <section id="prix-monnaie" className="legal-section">
              <h2><FiDollarSign /> {isAr ? '4. الأسعار والعملة الوطنية (الدينار الجزائري)' : '4. Monnaie légale & Affichage des prix'}</h2>
              <p>
                {isAr
                  ? 'وفقاً للتشريعات المالية الجزائرية، تُعرض جميع الأسعار بالدينار الجزائري (DZD). يجب أن يكون السعر المعروض واضحاً ويعبر عن القيمة الحقيقية للبيع أو الكراء (شهرياً أو لليلة واحدة للإقامات السياحية).'
                  : 'Conformément à la réglementation monétaire algérienne, les prix des biens sont affichés en Dinar Algérien (DZD). Les montants doivent être loyaux et stipulés au total ou par période (par mois pour les locations classiques, par nuitée pour les locations de vacances).'}
              </p>
            </section>

            <section id="ouedkniss-cgu" className="legal-section">
              <h2><FiAlertTriangle /> {isAr ? '5. الإعلانات المفهرسة من مصادر شريكة (Ouedkniss)' : '5. Contenus agrégés de sources tierces (Ouedkniss)'}</h2>
              <p>
                {isAr
                  ? 'بهدف إثراء الخيارات للمواطنين، قد تعرض داركم إعلانات عامة منشورة على منصات مثل واد كنيس مع روابط المصدر. تظل حقوق هذه الإعلانات ملكاً لأصحابها الأصليين. نحرص على التحديث المستمر وحذف الإعلانات المنتهية، ونوفر رابطاً مباشراً لطلب الحذف الفوري.'
                  : 'Afin d\'offrir un moteur de recherche immobilier exhaustif, Darkoum référence publiquement des annonces issues de plateformes ouvertes telles que Ouedkniss. Les droits de propriété intellectuelle des photos et descriptifs demeurent la propriété de leurs auteurs. Un dispositif automatisé de vérification et un formulaire de retrait sous 24h garantissent le respect des droits des annonceurs.'}
              </p>
            </section>

            <section id="responsabilite" className="legal-section">
              <h2><FiShield /> {isAr ? '6. حدود المسؤولية' : '6. Limitation de responsabilité'}</h2>
              <p>
                {isAr
                  ? 'تبذل داركم قصارى جهدها لضمان موثوقية وأمان المنصة، إلا أنها لا تتحمل المسؤولية عن أي خسائر ناتجة عن عدم دقة المعلومات المقدمة من طرف المعلنين أو عن انقطاعات فنية خارجة عن السيطرة.'
                  : 'Darkoum s\'efforce d\'assurer la disponibilité continue du service et l\'exactitude des annonces. Toutefois, la plateforme ne saurait être tenue pour responsable des éventuels préjudices matériels ou financiers résultant d\'inexactitudes dans les déclarations des annonceurs ou d\'interruptions techniques des réseaux de télécommunication.'}
              </p>
            </section>

            <section id="droit-applicable" className="legal-section">
              <h2><FiFileText /> {isAr ? '7. القانون المعمول به وتسوية النزاعات' : '7. Droit applicable & Règlement des litiges'}</h2>
              <p>
                {isAr
                  ? 'تخضع هذه الشروط وأي نزاع ينشأ عن استخدام المنصة للقوانين السارية في الجمهورية الجزائرية الديمقراطية الشعبية، وتختص المحاكم الجزائرية المختصة إقليمياً بالنظر في أي نزاع بعد تعذر الحل الودي.'
                  : 'Les présentes CGU sont régies par le droit algérien. En cas de différend relatif à l\'interprétation ou à l\'exécution des présentes, les parties s\'efforceront de trouver une issue amiable avant toute saisine des juridictions compétentes algériennes.'}
              </p>
              <Link to="/contact" className="legal-contact-btn">
                {isAr ? 'تواصل مع الدعم القانوني' : 'Contacter l\'équipe Darkoum'}
              </Link>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
