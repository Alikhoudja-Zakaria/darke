import { FiSearch, FiRefreshCw, FiPlusCircle } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import './EmptyState.css';

const EmptyState = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon,
  secondaryActionLabel,
  onSecondaryAction,
  suggestions = [],
  tip
}) => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <div className="empty-state-card">
      <div className="empty-state-icon-wrapper">
        {icon || <FiSearch size={36} />}
      </div>

      <h3 className="empty-state-title">
        {title || t('listing.no_results') || 'Aucune annonce trouvée'}
      </h3>

      <p className="empty-state-description">
        {description || t('listing.try_filters') || "Essayez de modifier vos critères de recherche ou réinitialisez les filtres pour découvrir d'autres opportunités."}
      </p>

      {tip && (
        <div className="empty-state-tip">
          <span>💡</span> <strong>Astuce :</strong> {tip}
        </div>
      )}

      <div className="empty-state-actions">
        {onAction && (
          <button 
            type="button" 
            className="btn-primary empty-state-btn"
            onClick={onAction}
          >
            {actionIcon || <FiRefreshCw size={16} />}
            <span>{actionLabel || t('filters.reset') || 'Réinitialiser les filtres'}</span>
          </button>
        )}

        {onSecondaryAction && secondaryActionLabel && (
          <button 
            type="button" 
            className="btn-outline empty-state-btn"
            onClick={onSecondaryAction}
          >
            <span>{secondaryActionLabel}</span>
          </button>
        )}

        {!onSecondaryAction && (
          <button 
            type="button" 
            className="btn-outline empty-state-btn"
            onClick={() => navigate('/post')}
          >
            <FiPlusCircle size={16} />
            <span>{t('nav.post') || 'Déposer une annonce'}</span>
          </button>
        )}
      </div>

      {suggestions.length > 0 && (
        <div className="empty-state-suggestions">
          <span className="empty-suggestions-label">Suggestions populaires :</span>
          <div className="empty-suggestions-tags">
            {suggestions.map((item, idx) => (
              <button 
                key={idx}
                type="button"
                className="empty-suggestion-tag"
                onClick={item.onClick}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmptyState;
