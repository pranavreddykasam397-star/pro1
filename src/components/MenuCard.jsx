import React from 'react';

export default function MenuCard({ item, onAddToCart, onUpdateQuantity, cartQuantity, index }) {
    return (
        <div className="menu-card" style={{ animationDelay: `${index * 0.05}s` }}>
            <div className="menu-card__image-container">
                <img 
                    src={item.imageUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500'} 
                    alt={item.name} 
                    className="menu-card__image"
                />
            </div>
            
            <div className="menu-card__info">
                <h3 className="menu-card__name">{item.name}</h3>
                <p className="menu-card__price">₹{item.price}</p>
            </div>

            <div className="menu-card__actions">
                {cartQuantity === 0 ? (
                    <button 
                        className="menu-card__add"
                        onClick={() => onAddToCart(item)}
                    >
                        <span>Add to Cart</span>
                    </button>
                ) : (
                    <div className="menu-card__qty">
                        <button 
                            className="qty-btn minus"
                            onClick={() => onUpdateQuantity(item.id, -1)}
                        >
                            −
                        </button>
                        <span className="qty-val">{cartQuantity}</span>
                        <button 
                            className="qty-btn plus"
                            onClick={() => onUpdateQuantity(item.id, 1)}
                        >
                            +
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
