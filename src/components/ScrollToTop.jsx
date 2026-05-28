import React, { useState, useEffect } from 'react';
import { FiArrowUp } from 'react-icons/fi';
import './ScrollToTop.css';

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
    window.addEventListener('scroll', toggleVisibility, { passive: true });
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <button 
      className="scroll-to-top"
      onClick={scrollToTop} 
      aria-label="Scroll to top"
    >
      <FiArrowUp size={24} />
    </button>
  );
};

export default ScrollToTop;
