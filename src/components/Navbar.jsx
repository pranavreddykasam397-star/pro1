import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Navbar({ cartCount, onCartClick }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">Our Restaurant</Link>
      
      <div className="nav-right" style={{ display: 'flex', alignItems: 'center' }}>
        <div className={`nav-links ${isOpen ? 'active' : ''}`}>
          <Link to="/" className="nav-link-btn" onClick={() => setIsOpen(false)}>Home</Link>
          {/* We'll use this primarily for scrolling or page switching in full React app */}
          <button className="nav-link-btn" onClick={() => { 
                setIsOpen(false);
                document.getElementById('menu-section')?.scrollIntoView({ behavior: 'smooth' });
            }}>Menu</button>
          
          <Link to="/admin" className="nav-link-btn admin-nav-link" onClick={() => setIsOpen(false)}>
            <span style={{ marginRight: '5px' }}>⚙</span> OWNER
          </Link>
        </div>

        <button 
          className="cart-icon-btn" 
          onClick={onCartClick}
          aria-label="Open Cart"
        >
          🛒
          {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
        </button>

        <button 
          className={`hamburger ${isOpen ? 'active' : ''}`} 
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle Menu"
        >
          <span></span><span></span><span></span>
        </button>
      </div>
    </nav>
  );
}
