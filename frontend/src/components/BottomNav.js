import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './BottomNav.css';

const BottomNav = () => {
  const location = useLocation();

  return (
    <nav className="bottom-nav"> 
      <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
        🏠 Home
      </Link>
      <Link to="/calendar" className={location.pathname === '/calendar' ? 'active' : ''}>
        📅 Calendar
      </Link>
      <Link to="/add-event" className={location.pathname === '/add-event' ? 'active' : ''}>
        ➕ Add Event
      </Link>
      <Link to="/schedule" className={location.pathname === '/schedule' ? 'active' : ''}>
        🗓️ Schedule
      </Link>
    </nav>
  );
};

export default BottomNav;