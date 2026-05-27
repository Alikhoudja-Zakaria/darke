import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import './ImageCarousel.css';

const ImageCarousel = ({ images, isDetails = false }) => {
  if (!images || images.length === 0) {
    return (
      <div className={`carousel-empty ${isDetails ? 'details-mode' : ''}`}>
        <span className="carousel-empty-text">Aucune image</span>
      </div>
    );
  }

  return (
    <div className={`carousel-container ${isDetails ? 'details-mode' : ''}`} onClick={(e) => e.stopPropagation()}>
      <Swiper
        modules={[Pagination, Navigation]}
        pagination={{ clickable: true }}
        navigation={true}
        className="property-swiper"
      >
        {images.map((src, idx) => (
          <SwiperSlide key={idx}>
            <img src={src} alt={`Vue ${idx + 1}`} className="carousel-image" loading="lazy" />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default ImageCarousel;
