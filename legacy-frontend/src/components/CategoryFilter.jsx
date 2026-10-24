import React from 'react';

const TYPE_IMAGES = {
    veg: 'https://i.pinimg.com/originals/e1/da/d5/e1dad5315972c8a9db86fb01d69c7ecb.jpg',
    nonveg: 'https://img.freepik.com/premium-photo/assorted-indian-non-vegetarian-food-recipe-served-group-includes-chicken-curry-mutton-masala-anda-egg-curry-butter-chicken-biryani-tandoori-murg-chicken-tikka-naa-roti-ramadan_466689-40865.jpg'
};

export default function CategoryFilter({ 
    menuType, 
    onMenuTypeChange, 
    activeCategory, 
    onCategoryChange, 
    categories 
}) {
    return (
        <section className="category-filter-section">
            <span className="section-eyebrow text-center eyebrow" style={{ display: 'block', color: 'var(--gold)', marginBottom: '1rem' }}>
                Hey, What's on your mind?
            </span>
            
            <div className="menu-type-container">
                <div 
                    className={`menu-type-card ${menuType === 'veg' ? 'active' : ''}`}
                    onClick={() => onMenuTypeChange('veg')}
                >
                    <h2>VEG</h2>
                    <img src={TYPE_IMAGES.veg} alt="Vegetarian Menu" />
                </div>
                <div 
                    className={`menu-type-card ${menuType === 'nonveg' ? 'active' : ''}`}
                    onClick={() => onMenuTypeChange('nonveg')}
                >
                    <h2>NON-VEG</h2>
                    <img src={TYPE_IMAGES.nonveg} alt="Non-Vegetarian Menu" />
                </div>
            </div>

            <div className="category-pill-row">
                {categories.map((cat) => (
                    <button
                        key={cat}
                        className={`category-btn ${activeCategory === cat ? 'active' : ''}`}
                        onClick={() => onCategoryChange(cat)}
                    >
                        {cat}
                    </button>
                ))}
            </div>
        </section>
    );
}
