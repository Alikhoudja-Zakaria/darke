import React, { useState, useEffect } from 'react';
import { FiArrowUp } from 'react-icons/fi';

const ScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  // Show button when page is scrolled down
  const toggleVisibility = () => {
    if (window.scrollY > 300) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  useEffect(() => {
    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <button 
      onClick={scrollToTop} 
      style={{
        position: 'fixed',
        bottom: '80px', // Above mobile navbar if any
        right: '24px',
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        backgroundColor: 'var(--primary-color)',
        color: 'white',
        border: 'none',
        boxShadow: 'var(--shadow-lg)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999,
        transition: 'all 0.3s ease-in-out',
        opacity: isVisible ? 1 : 0,
      }}
      aria-label="Scroll to top"
    >
      <FiArrowUp size={24} />
    </button>
  );
};

export default ScrollToTop;
