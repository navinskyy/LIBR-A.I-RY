import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { logout, getCurrentUser } from '../../services/auth';
import './header.css';

const Header = () => {
  const { isAuthenticated, isAdmin } = getCurrentUser();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="header-container">
      <nav className="header-nav">
        <div className="nav-left">
          <span className="brand">LIBR-AI-RY</span>

          {/* Always show Home */}
          <Link to="/home" className="main-nav-link">Home</Link>

          {/* Not logged in */}
          {!isAuthenticated && (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          )}

          {/* Logged in normal user */}
          {isAuthenticated && !isAdmin && (
            <>
              <Link to="/books" className="main-nav-link">Our Books</Link>
              <Link to="/user" className="main-nav-link">Chat</Link>
              <Link to="/borrowed" className="main-nav-link">Borrowed Books</Link>
            </>
          )}

          {/* Logged in admin */}
          {isAuthenticated && isAdmin && (
            <>
              <Link to="/user" className="main-nav-link">Chat</Link>
              <Link to="/books" className="main-nav-link">Our Books</Link>
              <Link to="/admin" classname="main-nav-link">Admin Dashboard</Link>
            </>
          )}
        </div>

        {isAuthenticated && (
          <div className="nav-right">
            <Link to="/account" className="settings-btn">
              Settings
            </Link>
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
