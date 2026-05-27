import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { createListing, updateListing } from '../firebase/listings';
import { uploadListingImage } from '../firebase/storage';
import { db } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { compressImage } from '../utils/imageCompression';
import { wilayas } from '../data/cities';
import { FiUploadCloud, FiX, FiCheck, FiChevronRight, FiChevronLeft } from 'react-icons/fi';
import './CreateListing.css';

const CreateListing = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    category: 'long-term',
    transactionType: 'rent', // 'rent' or 'buy'
    propertyType: 'apartment',
    title: '',
    description: '',
    rooms: 1,
    bathrooms: 1,
    surface: '',
    furnished: false,
    city: wilayas[0].name,
    address: '',
    price: '',
    priceUnit: 'per-month',
  });

  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [priceScale, setPriceScale] = useState('millions');

  React.useEffect(() => {
    if (id) {
      const fetchListing = async () => {
        try {
          const docRef = doc(db, 'listings', id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setFormData({
              category: data.category || 'long-term',
              transactionType: data.transactionType || 'rent',
              propertyType: data.propertyType || 'apartment',
              title: data.title || '',
              description: data.description || '',
              rooms: data.rooms || 1,
              bathrooms: data.bathrooms || 1,
              surface: data.surface || '',
              furnished: data.furnished || false,
              city: data.city || wilayas[0].name,
              address: data.address || '',
              price: data.price || '',
              priceUnit: data.priceUnit || 'per-month',
            });
            if (data.images && data.images.length > 0) {
              setImages(data.images);
              setImagePreviews(data.images);
            }
          }
        } catch (err) {
          console.error("Error fetching listing:", err);
          setError(t('post.error_fetch'));
        }
      };
      fetchListing();
    }
  }, [id, t]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > 3) {
      setError(t('post.form_photos_limit'));
      return;
    }
    
    setImages(prev => [...prev, ...files]);
    
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...previews]);
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => {
      const newPreviews = [...prev];
      if (typeof images[index] !== 'string') {
        URL.revokeObjectURL(newPreviews[index]);
      }
      newPreviews.splice(index, 1);
      return newPreviews;
    });
  };

  const handleSubmit = async () => {
    if (images.length === 0) {
      setError(t('post.form_photos_empty'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Compress and Upload Images
      const uploadedUrls = [];
      for (const item of images) {
        if (typeof item === 'string') {
          // It's already a URL from Firebase (existing image)
          uploadedUrls.push(item);
        } else {
          // It's a new File
          const compressedFile = await compressImage(item);
          const url = await uploadListingImage(compressedFile, user.uid);
          uploadedUrls.push(url);
        }
      }

      // 2. Prepare Data
      let finalPrice = parseFloat(formData.price);
      if (formData.category === 'long-term') {
        if (priceScale === 'mille') {
          finalPrice = finalPrice * 1000;
        } else if (priceScale === 'millions') {
          finalPrice = finalPrice * 1000000;
        } else if (priceScale === 'milliard') {
          finalPrice = finalPrice * 1000000000;
        }
      }

      const listingData = {
        ...formData,
        price: finalPrice,
        rooms: parseInt(formData.rooms),
        bathrooms: parseInt(formData.bathrooms),
        surface: parseInt(formData.surface),
        images: uploadedUrls,
        userId: user.uid,
        phone: user.phone || null, // Fallback to null if undefined
        city: formData.city, // Redundant but explicit
      };

      // 3. Save to Firestore
      if (id) {
        await updateListing(id, listingData);
        navigate(`/listing/${id}`);
      } else {
        const listingId = await createListing(listingData);
        navigate(`/listing/${listingId}`);
      }
    } catch (err) {
      console.error(err);
      setError(t('post.error_publish'));
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    // Validation before next step
    if (step === 2) {
      if (!formData.title || !formData.surface) {
        setError(t('post.error_validation'));
        return;
      }
    } else if (step === 3) {
      if (!formData.city) {
        setError(t('post.error_city'));
        return;
      }
    } else if (step === 4) {
      if (!formData.price) {
        setError(t('post.error_price'));
        return;
      }
    }
    
    setError('');
    setStep(prev => prev + 1);
    window.scrollTo(0, 0);
  };

  const prevStep = () => {
    setError('');
    setStep(prev => prev - 1);
    window.scrollTo(0, 0);
  };

  return (
    <div className="container" style={{ padding: '40px 0', maxWidth: '800px' }}>
      <h1 style={{ marginBottom: '24px', textAlign: 'center' }}>
        {id ? t('post.title_edit') : t('post.title_new')}
      </h1>
      
      <div className="wizard-progress">
        {[1, 2, 3, 4, 5].map(s => (
          <div key={s} className={`wizard-step-indicator ${step >= s ? 'active' : ''}`}>
            {step > s ? <FiCheck /> : s}
          </div>
        ))}
      </div>

      {error && <div className="alert-error" style={{ marginBottom: '20px', padding: '12px', backgroundColor: '#FEE2E2', color: '#DC2626', borderRadius: '8px' }}>{error}</div>}

      <div className="card wizard-card" style={{ padding: '32px', position: 'relative' }}>
        <button className="btn-close" onClick={() => navigate('/')} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#6B7280' }}>
          <FiX />
        </button>
        {step === 1 && (
          <div className="wizard-step">
            <h2>{t('post.type_question')}</h2>
            
            <div className="category-selector">
              <label className={`category-card ${formData.category === 'long-term' && formData.transactionType === 'rent' ? 'selected' : ''}`}>
                <input 
                  type="radio" 
                  name="category_type" 
                  onChange={() => setFormData({...formData, category: 'long-term', transactionType: 'rent', priceUnit: 'per-month'})}
                  checked={formData.category === 'long-term' && formData.transactionType === 'rent'}
                />
                <h3>{t('post.rent')}</h3>
                <p>{t('post.rent_desc')}</p>
              </label>

              <label className={`category-card ${formData.category === 'long-term' && formData.transactionType === 'buy' ? 'selected' : ''}`}>
                <input 
                  type="radio" 
                  name="category_type" 
                  onChange={() => setFormData({...formData, category: 'long-term', transactionType: 'buy', priceUnit: 'total'})}
                  checked={formData.category === 'long-term' && formData.transactionType === 'buy'}
                />
                <h3>{t('post.sale')}</h3>
                <p>{t('post.sale_desc')}</p>
              </label>

              <label className={`category-card ${formData.category === 'leisure' ? 'selected' : ''}`}>
                <input 
                  type="radio" 
                  name="category_type" 
                  onChange={() => setFormData({...formData, category: 'leisure', transactionType: 'rent', priceUnit: 'per-night'})}
                  checked={formData.category === 'leisure'}
                />
                <h3>{t('post.leisure')}</h3>
                <p>{t('post.leisure_desc')}</p>
              </label>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="wizard-step">
            <div className="form-group">
              <label className="label">{t('post.form_title')}</label>
              <input 
                type="text" 
                name="title" 
                className="input-field" 
                placeholder={t('post.form_title_placeholder')}
                value={formData.title} 
                onChange={handleChange} 
                required 
              />
            </div>
            
            <div className="form-group">
              <label className="label">{t('post.form_desc')}</label>
              <textarea 
                name="description" 
                className="input-field" 
                rows="4" 
                placeholder={t('post.form_desc_placeholder')}
                value={formData.description} 
                onChange={handleChange} 
                required 
              />
            </div>
            
            <div className="form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label className="label">{t('post.form_type')}</label>
                <select name="propertyType" className="input-field" value={formData.propertyType} onChange={handleChange}>
                  <option value="apartment">{t('property_types.apartment')}</option>
                  <option value="house">{t('property_types.house')}</option>
                  <option value="villa">{t('property_types.villa')}</option>
                  <option value="studio">{t('property_types.studio')}</option>
                  <option value="commercial">{t('property_types.commercial')}</option>
                  <option value="land">{t('property_types.land')}</option>
                </select>
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="label">{t('post.form_rooms')}</label>
                <input 
                  type="number" 
                  name="rooms" 
                  className="input-field" 
                  value={formData.rooms} 
                  onChange={handleChange} 
                  min="0"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label className="label">{t('post.form_baths')}</label>
                <input 
                  type="number" 
                  name="bathrooms" 
                  className="input-field" 
                  value={formData.bathrooms} 
                  onChange={handleChange} 
                  min="0"
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="label">{t('post.form_surface')}</label>
                <input 
                  type="number" 
                  name="surface" 
                  className="input-field" 
                  placeholder="Ex: 80"
                  value={formData.surface} 
                  onChange={handleChange} 
                  required 
                  min="1"
                />
              </div>
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input 
                type="checkbox" 
                id="furnished" 
                name="furnished" 
                checked={formData.furnished} 
                onChange={handleChange} 
                style={{ width: '20px', height: '20px' }}
              />
              <label htmlFor="furnished" className="label" style={{ margin: 0 }}>{t('post.form_furnished')}</label>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="wizard-step">
            <div className="form-group">
              <label className="label">{t('post.form_city')}</label>
              <select 
                name="city" 
                className="input-field" 
                value={formData.city} 
                onChange={handleChange}
                required
              >
                {wilayas.map(city => (
                  <option key={city.id} value={city.name}>{city.name}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label className="label">{t('post.form_address')}</label>
              <input 
                type="text" 
                name="address" 
                className="input-field" 
                placeholder={t('post.form_address_placeholder')}
                value={formData.address} 
                onChange={handleChange} 
              />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="wizard-step">
            <div className="form-group">
              <label className="label">{t('post.form_price')}</label>
              <div style={{ display: 'flex', gap: '16px' }}>
                <input 
                  type="number" 
                  name="price" 
                  className="input-field" 
                  placeholder={formData.category === 'long-term' ? "Ex: 1.5" : "Ex: 45000"}
                  value={formData.price} 
                  onChange={handleChange} 
                  step={formData.category === 'long-term' ? "any" : "1"}
                  min="0.1"
                  style={{ flex: 1 }}
                />
                
                {formData.category === 'long-term' && (
                  <select 
                    name="priceScale" 
                    className="input-field" 
                    value={priceScale} 
                    onChange={(e) => setPriceScale(e.target.value)}
                    style={{ width: '150px' }}
                  >
                    <option value="DA">DA</option>
                    <option value="mille">{t('listing.thousand')}</option>
                    <option value="millions">{t('listing.million')}</option>
                    <option value="milliard">{t('listing.billion')}</option>
                  </select>
                )}
                
                {formData.category === 'leisure' && (
                  <select 
                    name="priceUnit" 
                    className="input-field" 
                    value={formData.priceUnit} 
                    onChange={handleChange}
                    style={{ width: '150px' }}
                  >
                    <option value="per-night">/ Nuit</option>
                    <option value="per-week">/ Semaine</option>
                  </select>
                )}
              </div>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="wizard-step">
            <div className="form-group">
              <label className="label">{t('post.form_photos')}</label>
              <p style={{ color: '#6B7280', marginBottom: '16px', fontSize: '0.9rem' }}>
                {t('post.form_photos_desc')}
              </p>
              
              <div className="image-upload-area">
                <input 
                  type="file" 
                  id="image-upload" 
                  multiple 
                  accept="image/*" 
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />
                <label htmlFor="image-upload" className="upload-label">
                  <FiUploadCloud size={40} color="#10B981" />
                  <span>{t('post.form_photos_upload')}</span>
                </label>
              </div>

              <div className="image-preview-grid">
                {imagePreviews.map((src, index) => (
                  <div key={index} className="image-preview-item">
                    <img src={src} alt={`preview ${index}`} />
                    <button type="button" className="btn-remove-img" onClick={() => removeImage(index)}>
                      <FiX />
                    </button>
                    {index === 0 && <span className="img-badge-main">{t('post.form_photos_main')}</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="wizard-actions">
          {step > 1 && (
            <button className="btn-outline" onClick={prevStep}>
              <FiChevronLeft /> {t('post.btn_prev')}
            </button>
          )}
          
          {step < 5 ? (
            <button className="btn-primary" onClick={nextStep} style={{ marginLeft: 'auto' }}>
              {t('post.btn_next')} <FiChevronRight />
            </button>
          ) : (
            <button className="btn-primary" onClick={handleSubmit} disabled={loading} style={{ marginLeft: 'auto' }}>
              {loading ? (id ? t('post.btn_saving') : t('post.btn_publishing')) : (id ? t('post.btn_save') : t('post.btn_publish'))}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateListing;

