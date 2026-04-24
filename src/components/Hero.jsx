import React from 'react';

export default function Hero({ onExploreClick }) {
  return (
    <section className="hero">
      <div className="hero-inner">
        <span className="hero-ornament">Est. Since Always</span>
        <h1 className="hero-heading">Our Restaurant</h1>
        <span className="hero-rule"></span>
        <p className="hero-tagline">Fine Indian Cuisine · Crafted with Tradition</p>
        <button className="hero-cta" onClick={onExploreClick}>
          Explore Our Menu
        </button>
      </div>
    </section>
  );
}
