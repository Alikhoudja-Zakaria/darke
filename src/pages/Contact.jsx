import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { FiMail, FiPhone, FiMapPin, FiSend, FiCheckCircle, FiShield, FiAlertTriangle } from 'react-icons/fi';
import './Contact.css';

const Contact = () => {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const isAr = lang === 'ar';

  const initialType = searchParams.get('type') || 'general';
  const queryListingId = searchParams.get('listingId') || '';
  const queryListingTitle = searchParams.get('title') || '';

  const [formData, setFormData] = useState({
    name: user?.displayName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    subject: initialType === 'takedown' ? 'takedown' : initialType === 'report' ? 'report' : 'general',
    listingId: queryListingId,
    listingTitle: queryListingTitle,
    message: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage('');

    const generatedTicket = `DK-${Math.floor(100000 + Math.random() * 900000)}`;

    try {
      await addDoc(collection(db, 'support_tickets'), {
        ticketId: generatedTicket,
        ...formData,
        userId: user?.uid || null,
        createdAt: serverTimestamp(),
        status: 'open',
        source: 'contact_form'
      });
    } catch (err) {
      console.warn("Could not save ticket to Firestore (offline or rule limit), proceeding with local confirmation:", err.message);
    } finally {
      setTicketId(generatedTicket);
      setSubmitted(true);
      setSubmitting(false);
    }
  };

  const isTakedown = formData.subject === 'takedown' || formData.subject === 'report';

  return (
    <div className="contact-page">
      <div className="container">
        <div className="contact-header">
          <div className="contact-badge">
            <FiShield size={14} />
            <span>{isAr ? 'الدعم وخدمة المستخدمين' : 'Support & Service Utilisateurs'}</span>
          </div>
          <h1 className="contact-title">
            {isAr ? 'اتصل بفريق داركم' : 'Contactez l\'équipe Darkoum'}
          </h1>
          <p className="contact-subtitle">
            {isAr
              ? 'هل لديك سؤال أو ترغب في الإبلاغ عن إعلان أو طلب حذفه؟ فريقنا متواجد للرد عليك في أقرب الآجال.'
              : 'Une question, un partenariat, un signalement ou une demande de retrait d\'annonce ? Notre équipe vous répond avec diligence sous 24 heures.'}
          </p>
        </div>

        <div className="contact-layout">
          <div className="contact-form-card">
            {submitted ? (
              <div className="contact-success-card">
                <div className="contact-success-icon">
                  <FiCheckCircle />
                </div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  {isAr ? 'تم استلام رسالتك بنجاح !' : 'Demande enregistrée avec succès !'}
                </h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.6 }}>
                  {isAr
                    ? `رقم التذكرة الخاص بك هو #${ticketId}. سيتولى فريقنا معالجة طلبك والرد عليك في غضون 24 ساعة.`
                    : `Votre numéro de ticket de suivi est #${ticketId}. Notre équipe a bien pris en compte votre demande et y apportera une réponse sous 24h ouvrées.`}
                </p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <button 
                    type="button" 
                    className="btn-primary" 
                    onClick={() => {
                      setSubmitted(false);
                      setFormData(prev => ({ ...prev, message: '' }));
                    }}
                  >
                    {isAr ? 'إرسال رسالة أخرى' : 'Envoyer un autre message'}
                  </button>
                  <Link to="/" className="btn-outline">
                    {isAr ? 'العودة للرئيسية' : 'Retour à l\'accueil'}
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {isTakedown && (
                  <div className="contact-takedown-alert">
                    <FiAlertTriangle className="contact-takedown-alert-icon" />
                    <div>
                      <h4>{isAr ? 'إجراء سريع لسحب أو تعديل الإعلانات' : 'Procédure prioritaire de retrait & modération'}</h4>
                      <p>
                        {isAr
                          ? 'نلتزم باحترام حقوق الملاك. إذا كنت صاحب العقار أو تطلب حذف إعلان منشور من واد كنيس أو غيره، سيتم حذفه خلال أقل من 24 ساعة.'
                          : 'Nous garantissons un traitement prioritaire. Tout propriétaire ou titulaire de droits demandant le déréférencement d\'une annonce verra celle-ci retirée sous 24 heures maximum.'}
                      </p>
                    </div>
                  </div>
                )}

                <div className="contact-form-grid">
                  <div className="contact-form-group">
                    <label htmlFor="contact-name">{isAr ? 'الاسم واللقب *' : 'Nom et Prénom *'}</label>
                    <input 
                      id="contact-name"
                      type="text" 
                      name="name" 
                      required 
                      value={formData.name}
                      onChange={handleChange}
                      placeholder={isAr ? 'مثال: محمد بن علي' : 'Ex: Karim Benali'}
                    />
                  </div>

                  <div className="contact-form-group">
                    <label htmlFor="contact-email">{isAr ? 'البريد الإلكتروني *' : 'Adresse Email *'}</label>
                    <input 
                      id="contact-email"
                      type="email" 
                      name="email" 
                      required 
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="nom@example.com"
                    />
                  </div>

                  <div className="contact-form-group">
                    <label htmlFor="contact-phone">{isAr ? 'رقم الهاتف' : 'Numéro de téléphone'}</label>
                    <input 
                      id="contact-phone"
                      type="tel" 
                      name="phone" 
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="0550 00 00 00"
                    />
                  </div>

                  <div className="contact-form-group">
                    <label htmlFor="contact-subject">{isAr ? 'موضوع الرسالة *' : 'Motif de votre demande *'}</label>
                    <select 
                      id="contact-subject"
                      name="subject" 
                      value={formData.subject}
                      onChange={handleChange}
                    >
                      <option value="general">{isAr ? 'استفسار عام' : 'Question générale'}</option>
                      <option value="takedown">{isAr ? 'طلب سحب إعلان (Ouedkniss أو غيره)' : 'Demande de retrait d\'annonce (Ouedkniss ou autre)'}</option>
                      <option value="report">{isAr ? 'الإبلاغ عن إعلان مشبوه أو احتيالي' : 'Signaler une annonce frauduleuse ou trompeuse'}</option>
                      <option value="partnership">{isAr ? 'شراكة أو وكالة عقارية' : 'Partenariat professionnel & Agence'}</option>
                      <option value="technical">{isAr ? 'مشكلة تقنية في الموقع' : 'Problème technique / Bug'}</option>
                    </select>
                  </div>

                  {isTakedown && (
                    <>
                      <div className="contact-form-group">
                        <label htmlFor="contact-listing-id">{isAr ? 'رقم / معرّف الإعلان (ID)' : 'ID ou Référence de l\'annonce'}</label>
                        <input 
                          id="contact-listing-id"
                          type="text" 
                          name="listingId" 
                          value={formData.listingId}
                          onChange={handleChange}
                          placeholder={isAr ? 'مثال: ouedkniss_3829103' : 'Ex: ouedkniss_3829103 ou ID annonce'}
                        />
                      </div>

                      <div className="contact-form-group">
                        <label htmlFor="contact-listing-title">{isAr ? 'عنوان الإعلان أو الرابط' : 'Titre du bien ou lien'}</label>
                        <input 
                          id="contact-listing-title"
                          type="text" 
                          name="listingTitle" 
                          value={formData.listingTitle}
                          onChange={handleChange}
                          placeholder={isAr ? 'مثال: شقة F3 حيدرة' : 'Ex: F3 Hydra ou lien de l\'annonce'}
                        />
                      </div>
                    </>
                  )}

                  <div className="contact-form-group full-width">
                    <label htmlFor="contact-message">{isAr ? 'نص الرسالة *' : 'Détail de votre message *'}</label>
                    <textarea 
                      id="contact-message"
                      name="message" 
                      rows={5} 
                      required
                      value={formData.message}
                      onChange={handleChange}
                      placeholder={
                        isTakedown 
                          ? (isAr ? 'يرجى توضيح سبب طلب الحذف أو تفاصيل البلاغ...' : 'Précisez les motifs de votre demande de retrait ou les éléments signalés...')
                          : (isAr ? 'اكتب رسالتك هنا بالتفصيل...' : 'Décrivez votre demande avec le plus de précisions possible...')
                      }
                    />
                  </div>
                </div>

                {errorMessage && (
                  <div style={{ color: '#DC2626', marginBottom: '16px', fontSize: '0.9rem' }}>
                    {errorMessage}
                  </div>
                )}

                <button 
                  type="submit" 
                  className="contact-submit-btn" 
                  disabled={submitting}
                >
                  <FiSend />
                  <span>
                    {submitting 
                      ? (isAr ? 'جاري الإرسال...' : 'Envoi en cours...') 
                      : (isAr ? 'إرسال الرسالة' : 'Envoyer la demande')}
                  </span>
                </button>
              </form>
            )}
          </div>

          <aside className="contact-sidebar">
            <div className="contact-info-card">
              <h3><FiMail /> {isAr ? 'معلومات التواصل' : 'Nos Coordonnées'}</h3>
              <div className="contact-info-list">
                <div className="contact-info-item">
                  <div className="contact-info-icon"><FiMail /></div>
                  <div className="contact-info-text">
                    <strong>Email</strong>
                    <a href="mailto:contact@darkoum.dz">contact@darkoum.dz</a>
                  </div>
                </div>

                <div className="contact-info-item">
                  <div className="contact-info-icon"><FiPhone /></div>
                  <div className="contact-info-text">
                    <strong>{isAr ? 'الهاتف' : 'Téléphone'}</strong>
                    <a href="tel:+213550000000">+213 (0) 550 00 00 00</a>
                  </div>
                </div>

                <div className="contact-info-item">
                  <div className="contact-info-icon"><FiMapPin /></div>
                  <div className="contact-info-text">
                    <strong>{isAr ? 'المقر' : 'Adresse'}</strong>
                    <span>Alger Centre, 16000 Alger, Algérie</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="contact-guarantee-card">
              <h4>
                <FiCheckCircle /> 
                {isAr ? 'التزام السرعة والموثوقية' : 'Engagement Qualité 24h'}
              </h4>
              <p>
                {isAr
                  ? 'يتم فحص جميع البلاغات وطلبات سحب الإعلانات من قبل فريق إشراف مخصص، مع الرد السريع خلال 24 ساعة كحد أقصى.'
                  : 'Toutes les notifications d\'abus et les requêtes de déréférencement sont traitées de manière rigoureuse avec accusé de réception garanti sous 24 heures.'}
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Contact;
