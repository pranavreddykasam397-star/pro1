import React, { useEffect, useRef } from 'react';
import { DiscountGamesUI } from '../js_games/DiscountGamesUI';

export default function CartSidebar({ 
    isOpen, 
    onClose, 
    cartItems, 
    onUpdateQuantity, 
    onPlaceOrder,
    cartTotal,
    discountPercent = 0,
    discountAmount = 0,
    gstAmount = 0,
    finalTotal = 0,
    onDiscountUnlocked
}) {
    const gameContainerRef = useRef(null);
    const gameInstanceRef = useRef(null);

    // Initialize Vanilla JS Game
    useEffect(() => {
        if (cartTotal >= 1500 && discountPercent === 0) {
            if (gameContainerRef.current && !gameInstanceRef.current) {
                gameInstanceRef.current = new DiscountGamesUI(gameContainerRef.current, () => {
                    if (onDiscountUnlocked) onDiscountUnlocked();
                });
            }
        } else {
            // Cleanup if conditions not met
            if (gameInstanceRef.current) {
                gameInstanceRef.current = null;
                if (gameContainerRef.current) {
                    gameContainerRef.current.innerHTML = '';
                }
            }
        }
    }, [cartTotal, discountPercent, onDiscountUnlocked]);


    let progress = 0;
    let message = "";
    if (cartTotal === 0) {
        progress = 0;
        message = "Add items to unlock discounts!";
    } else if (cartTotal < 1500) {
        progress = (cartTotal / 1500) * 100;
        message = `Add ₹${1500 - cartTotal} more to unlock 10% discount!`;
    } else if (cartTotal < 2000) {
        progress = ((cartTotal - 1500) / 500) * 100;
        message = `Add ₹${2000 - cartTotal} more to unlock 15% discount! (10% unlocked ✨)`;
    } else {
        progress = 100;
        message = "🎉 You've unlocked the maximum 15% discount!";
    }

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

                <div className="cart__body" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '1rem', background: 'var(--cream-deep)', borderBottom: '1px solid var(--parchment)', flexShrink: 0 }}>
                        <p style={{ fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 'bold', color: discountPercent > 0 ? '#27ae60' : 'var(--ink)' }}>
                            {message}
                        </p>
                        <div style={{ width: '100%', height: '8px', background: '#e0e0e0', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${Math.min(progress, 100)}%`, height: '100%', background: discountPercent === 15 ? '#27ae60' : 'var(--gold)', transition: 'width 0.3s ease' }}></div>
                        </div>
                    </div>

                    <div ref={gameContainerRef} style={{ padding: '0 1rem', flexShrink: 0 }}></div>

                    <div className="cart__items" style={{ flex: 1, overflowY: 'visible', padding: '1.2rem 1.4rem' }}>
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
                </div>

                <div className="cart__footer">
                    <div className="cart__total-row">
                        <span className="cart__total-label">Subtotal</span>
                        <span className="cart__total-amount">₹{cartTotal}</span>
                    </div>
                    {discountAmount > 0 && (
                        <div className="cart__total-row" style={{ color: '#27ae60' }}>
                            <span className="cart__total-label">Discount ({discountPercent}%)</span>
                            <span className="cart__total-amount">- ₹{discountAmount}</span>
                        </div>
                    )}
                    {cartTotal > 0 && (
                        <>
                            <div className="cart__total-row" style={{ color: 'var(--text-soft)', fontSize: '0.9rem' }}>
                                <span className="cart__total-label">GST (5%)</span>
                                <span className="cart__total-amount">+ ₹{gstAmount}</span>
                            </div>
                        </>
                    )}
                    <div className="cart__total-row" style={{ borderTop: '1px solid var(--parchment)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                        <span className="cart__total-label" style={{ fontWeight: 'bold' }}>Final Total</span>
                        <span className="cart__total-amount" style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--gold)' }}>₹{finalTotal || cartTotal}</span>
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
