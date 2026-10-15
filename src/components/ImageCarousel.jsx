import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation } from 'swiper/modules';
import { useLanguage } from '../context/LanguageContext';
import { getOptimizedImageUrl, FALLBACK_PROPERTY_IMAGE } from '../utils/imageOptimizer';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import './ImageCarousel.css';

const ImageCarousel = ({ images, isDetails = false }) => {
  const { t } = useLanguage();

  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = FALLBACK_PROPERTY_IMAGE;
  };

  if (!images || images.length === 0) {
    return (
      <div className={`carousel-empty ${isDetails ? 'details-mode' : ''}`}>
        <span className="carousel-empty-text">{t('listing.no_images') || 'Aucune image'}</span>
      </div>
    );
  }

  const targetSize = isDetails ? 'large' : 'thumb';

  // If only 1 image on cards, render directly without mounting Swiper overhead
  if (!isDetails && images.length === 1) {
    return (
      <div className="carousel-container single-image" onClick={(e) => { e.preventDefault(); }}>
        <img 
          src={getOptimizedImageUrl(images[0], targetSize)} 
          alt="Vue 1" 
          className="carousel-image" 
          loading="lazy" 
          decoding="async"
          onError={handleImageError}
        />
      </div>
    );
  }

  return (
    <div className={`carousel-container ${isDetails ? 'details-mode' : ''}`} onClick={(e) => { e.preventDefault(); }}>
      <Swiper
        modules={[Pagination, Navigation]}
        pagination={{ clickable: true }}
        navigation={true}
        className="property-swiper"
      >
        {images.map((src, idx) => (
          <SwiperSlide key={idx}>
            <img 
              src={getOptimizedImageUrl(src, targetSize)} 
              alt={`Vue ${idx + 1}`} 
              className="carousel-image" 
              loading={idx === 0 ? "eager" : "lazy"} 
              decoding="async"
              onError={handleImageError}
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default ImageCarousel;
