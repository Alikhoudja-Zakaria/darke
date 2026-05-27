import React from 'react';
import './Badge.css';

const Badge = ({ type, children }) => {
  return (
    <span className={`badge badge-${type}`}>
      {children}
    </span>
  );
};

export default Badge;
