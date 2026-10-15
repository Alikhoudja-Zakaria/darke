import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { FiArrowUp } from 'react-icons/fi';
import './ScrollToTop.css';

const ScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false);
  const location = useLocation();
  const isDetailsPage = location.pathname.startsWith('/listing/');

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

  return (
    <button 
      type="button"
      className={`scroll-to-top ${isVisible ? 'visible' : ''} ${isDetailsPage ? 'elevated' : ''}`}
      onClick={scrollToTop} 
      aria-label="Scroll to top"
    >
      <FiArrowUp size={24} />
    </button>
  );
};

export default ScrollToTop;
