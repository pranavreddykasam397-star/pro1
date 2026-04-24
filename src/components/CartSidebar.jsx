import React from 'react';

export default function CartSidebar({ 
    isOpen, 
    onClose, 
    cartItems, 
    onUpdateQuantity, 
    onPlaceOrder,
    cartTotal 
}) {
    return (
        <>
            <div 
                className={`cart-overlay ${isOpen ? 'active' : ''}`}
                onClick={onClose}
            ></div>
            
            <div className={`cart-drawer ${isOpen ? 'active' : ''}`}>
                <div className="cart__header">
                    <h2 className="cart__title">Your Selection</h2>
                    <button className="cart__close" onClick={onClose}>&times;</button>
                </div>

                <div className="cart__items">
                    {cartItems.length === 0 ? (
                        <p className="text-center text-muted" style={{ marginTop: '3rem' }}>
                            Your cart is currently empty.
                        </p>
                    ) : (
                        cartItems.map((item) => (
                            <div key={item.id} className="cart-item">
                                <div className="cart-item__info">
                                    <h4>{item.name}</h4>
                                    <span className="cart-item__price">₹{item.price} × {item.quantity}</span>
                                </div>
                                <div className="cart-item__qty-controls">
                                    <button 
                                        className="qty-btn minus"
                                        style={{ width: '24px', height: '24px', fontSize: '0.8rem' }}
                                        onClick={() => onUpdateQuantity(item.id, -1)}
                                    >
                                        −
                                    </button>
                                    <span className="qty-val" style={{ minWidth: '15px' }}>{item.quantity}</span>
                                    <button 
                                        className="qty-btn plus"
                                        style={{ width: '24px', height: '24px', fontSize: '0.8rem' }}
                                        onClick={() => onUpdateQuantity(item.id, 1)}
                                        disabled={item.quantity >= 99} /* [Fix 1.5] Cap max quantity at 99 */
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="cart__footer">
                    <div className="cart__total-row">
                        <span className="cart__total-label">Subtotal</span>
                        <span className="cart__total-amount">₹{cartTotal}</span>
                    </div>
                    
                    <button 
                        className="cart__checkout-btn"
                        disabled={cartItems.length === 0}
                        onClick={onPlaceOrder}
                    >
                        Place Your Order
                    </button>
                </div>
            </div>
        </>
    );
}
