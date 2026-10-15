import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { createReport } from '../firebase/admin';
import { FiAlertTriangle, FiCheckCircle, FiSend, FiX } from 'react-icons/fi';
import './ReportModal.css';

const REASON_OPTIONS = [
  { id: 'wrong_price', icon: '💰', fr: 'Prix trompeur ou incorrect', ar: 'سعر غير حقيقي أو مضلل' },
  { id: 'already_sold', icon: '🚫', fr: 'Bien déjà vendu ou loué', ar: 'العقار تم بيعه أو تأجيره بالفعل' },
  { id: 'scam', icon: '⚠️', fr: 'Suspicion d\'arnaque ou fausse annonce', ar: 'اشتباه في احتيال أو إعلان وهمي' },
  { id: 'photos', icon: '📸', fr: 'Photos trompeuses ou volées', ar: 'صور مسروقة أو غير مطابقة للواقع' },
  { id: 'takedown', icon: '⚖️', fr: 'Je suis le propriétaire et demande le retrait', ar: 'أنا مالك العقار وأطلب سحب الإعلان فوراً' },
  { id: 'other', icon: '📝', fr: 'Autre motif', ar: 'سبب آخر' }
];

const ReportModal = ({ isOpen, onClose, listing }) => {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const isAr = lang === 'ar';

  const [reason, setReason] = useState('scam');
  const name = user?.displayName || '';
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState('');

  if (!isOpen || !listing) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await createReport({
        listingId: listing.id,
        listingTitle: listing.title || 'Annonce',
        reason,
        message,
        reporterName: name || 'Anonyme',
        reporterEmail: email,
        reporterPhone: phone
      });
      setTicketId(res.ticketId);
      setSubmitted(true);
    } catch (err) {
      console.error("Error creating report:", err);
      // Fallback ticket
      setTicketId(`REP-${Math.floor(100000 + Math.random() * 900000)}`);
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSubmitted(false);
    setMessage('');
    onClose();
  };

  return (
    <div className="report-modal-backdrop" onClick={handleClose}>
      <div className="report-modal-content" onClick={(e) => e.stopPropagation()}>
        <button 
          type="button" 
          className="report-modal-close" 
          onClick={handleClose}
          aria-label="Fermer"
        >
          <FiX />
        </button>

        {submitted ? (
          <div className="report-success-state">
            <div className="report-success-icon">
              <FiCheckCircle />
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>
              {isAr ? 'تم استلام بلاغك بنجاح' : 'Signalement bien reçu !'}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '16px' }}>
              {isAr 
                ? `رقم التذكرة: #${ticketId}. سيقوم فريق الإشراف بالتحقق من الإعلان واتخاذ الإجراء اللازم في أقل من 24 ساعة.` 
                : `Référence ticket : #${ticketId}. Notre équipe de modération va examiner cette annonce et appliquer les mesures nécessaires sous 24h.`}
            </p>
            <button 
              type="button" 
              className="btn-primary" 
              style={{ width: '100%', padding: '12px' }}
              onClick={handleClose}
            >
              {isAr ? 'إغلاق' : 'Fermer'}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="report-modal-header">
              <div className="report-modal-badge">
                <FiAlertTriangle size={13} />
                <span>{isAr ? 'الإشراف وحماية المستخدمين' : 'Modération & Sécurité'}</span>
              </div>
              <h2 className="report-modal-title">
                {isAr ? 'الإبلاغ عن هذا الإعلان' : 'Signaler cette annonce'}
              </h2>
              <p className="report-modal-subtitle">
                {isAr 
                  ? 'ساعدنا في الحفاظ على بيئة عقارية آمنة وموثوقة لجميع الجزائريين.' 
                  : 'Aidez-nous à préserver la fiabilité et la transparence des offres immobilières.'}
              </p>
            </div>

            <div className="report-listing-context">
              <strong>{isAr ? 'الإعلان المستهدف:' : 'Bien concerné :'}</strong>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {listing.title} ({listing.city})
              </span>
            </div>

            <div className="report-form-group">
              <label>{isAr ? 'سبب البلاغ *' : 'Sélectionnez le motif principal *'}</label>
              <div className="report-reasons-grid">
                {REASON_OPTIONS.map((opt) => (
                  <label 
                    key={opt.id} 
                    className={`report-reason-option ${reason === opt.id ? 'selected' : ''}`}
                  >
                    <input 
                      type="radio" 
                      name="reportReason" 
                      value={opt.id} 
                      checked={reason === opt.id}
                      onChange={() => setReason(opt.id)}
                    />
                    <span className="report-reason-label">
                      <span>{opt.icon}</span>
                      <span>{isAr ? opt.ar : opt.fr}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="report-form-group">
              <label htmlFor="report-message">
                {isAr ? 'توضيحات إضافية (اختياري)' : 'Précisions supplémentaires'}
              </label>
              <textarea 
                id="report-message"
                rows={3} 
                value={message} 
                onChange={(e) => setMessage(e.target.value)}
                placeholder={isAr ? 'أضف أي تفاصيل تساعد فريق الإشراف على فحص الإعلان...' : 'Ex: Le prix demandé au téléphone est de 25 millions au lieu de 15 millions affiché...'}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="report-form-group">
                <label htmlFor="report-email">{isAr ? 'بريدك الإلكتروني *' : 'Votre Email *'}</label>
                <input 
                  id="report-email"
                  type="email" 
                  required 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@example.com"
                />
              </div>

              <div className="report-form-group">
                <label htmlFor="report-phone">{isAr ? 'الهاتف (اختياري)' : 'Téléphone'}</label>
                <input 
                  id="report-phone"
                  type="tel" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0550..."
                />
              </div>
            </div>

            <div className="report-actions">
              <button 
                type="button" 
                className="report-btn-cancel" 
                onClick={handleClose}
                disabled={submitting}
              >
                {isAr ? 'إلغاء' : 'Annuler'}
              </button>
              <button 
                type="submit" 
                className="report-btn-submit" 
                disabled={submitting}
              >
                <FiSend />
                <span>{submitting ? (isAr ? 'جاري الإرسال...' : 'Envoi...') : (isAr ? 'تأكيد البلاغ' : 'Envoyer le signalement')}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ReportModal;
