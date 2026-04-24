import React, { useState, useEffect, useRef, useMemo } from 'react'; // [Fix 3.4] Add useMemo
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import CategoryFilter from './components/CategoryFilter';
import MenuCard from './components/MenuCard';
import CartSidebar from './components/CartSidebar';

const API_URL = 'http://localhost:3000/api';

function CustomerView({ menu, cart, setCart, ownerQr, onOrderComplete, dailySpecial }) {
  const [showPayment, setShowPayment] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('QR');
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  const [menuType, setMenuType] = useState('veg');
  const [activeCategory, setActiveCategory] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  
  const menuRef = useRef(null);

  const addToCart = (item) => {
    const existing = cart.find(i => i.id === item.id);
    if (existing) {
        updateQuantity(item.id, 1);
    } else {
        setCart([...cart, { ...item, quantity: 1 }]);
    }
  };
  
  const updateQuantity = (id, delta) => {
    const existing = cart.find(i => i.id === id);
    if (!existing) return;
    
    if (existing.quantity + delta <= 0) {
        setCart(cart.filter(i => i.id !== id));
    } else {
        setCart(cart.map(i => i.id === id ? { ...i, quantity: i.quantity + delta } : i));
    }
  };

  const cartTotal = cart.reduce((sum, i) => sum + (i.price * (i.quantity || 1)), 0);
  const cartCount = cart.reduce((sum, i) => sum + (i.quantity || 1), 0);

  // [Fix 3.4] Wrap derived array in useMemo to prevent render loops
  const availableCategories = useMemo(() => {
      return [...new Set(
          menu.filter(item => item.type === menuType).map(item => item.category)
      )].sort((a, b) => {
          if (a === "TODAY'S SPECIAL") return -1;
          if (b === "TODAY'S SPECIAL") return 1;
          return a.localeCompare(b);
      });
  }, [menu, menuType]);

  useEffect(() => {
    if (availableCategories.length > 0) {
        if (!activeCategory || !availableCategories.includes(activeCategory)) {
            setActiveCategory(availableCategories[0]);
        }
    }
  }, [availableCategories, activeCategory]);

  const filteredMenu = menu.filter(item => 
    item.type === menuType && (activeCategory === '' || item.category === activeCategory)
  );

  const scrollToMenu = () => {
    setShowMenu(true);
    setTimeout(() => {
        menuRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const initiateCheckout = () => {
    if (cart.length === 0) return alert('Cart is empty!');
    setShowPayment(true);
    setIsCartOpen(false);
  };

  const processPayment = async () => {
    setIsProcessing(true);
    const newOrder = {
        items: [...cart],
        total: cartTotal,
        method: paymentMethod,
        time: new Date().toLocaleTimeString(),
        timeHash: Date.now()
    };

    try {
        await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newOrder)
        });

        onOrderComplete();

        let text = `*New Order Confirmed*\n\n`;
        text += `Payment Method: ${paymentMethod === 'QR' ? 'Paid via QR Code' : 'Cash on Delivery'}\n\n`;
        cart.forEach(i => text += `- ${i.name} (x${i.quantity || 1}) (₹${i.price})\n`);
        text += `\nTotal: ₹${newOrder.total}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');

        setCart([]);
        alert("Order sent to restaurant!");
    } catch (e) {
        console.error(e);
        alert("Failed to submit order.");
    } finally {
        setIsProcessing(false);
        setShowPayment(false);
    }
  };

  return (
    <div className="customer-view-container">
      <Navbar cartCount={cartCount} onCartClick={() => setIsCartOpen(true)} />
      
      <CartSidebar 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cart}
        onUpdateQuantity={updateQuantity}
        onPlaceOrder={initiateCheckout}
        cartTotal={cartTotal}
      />
      
      <Hero onExploreClick={scrollToMenu} />
      
      {showMenu && (
        <div id="menu-section" ref={menuRef} className="reveal-animation"> {/* [Fix 3.3] attach ID for scroll anchor */}
          {dailySpecial && dailySpecial.type === menuType && ( /* [Fix 3.2] Banner respects veg/non-veg filter */
            <div style={{ maxWidth: '1100px', margin: '0 auto 3rem', padding: '0 2rem' }}>
              <div style={{
                position: 'relative', 
                borderRadius: '8px', 
                overflow: 'hidden', 
                boxShadow: 'var(--shadow-lg)',
                background: 'var(--cream-deep)'
              }}>
                <img 
                  src={dailySpecial.imageUrl} 
                  alt={dailySpecial.text} 
                  style={{ width: '100%', height: '400px', objectFit: 'cover', display: 'block' }} 
                />
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: 'linear-gradient(transparent, rgba(26,22,16,0.9))',
                  padding: '2rem',
                  color: 'var(--cream)'
                }}>
                  <p className="eyebrow" style={{ color: 'var(--gold)', marginBottom: '0.5rem' }}>✨ Today's Magic Special ✨</p>
                  <h3 className="serif" style={{ fontSize: '1.8rem', margin: 0, marginBottom: '1rem' }}>{dailySpecial.text}</h3>
                  {/* [Fix 3.1] Add-to-cart button styled like existing ones */}
                  <button className="menu-card__add" style={{ width: 'auto', padding: '0.5rem 2rem' }} onClick={() => addToCart(dailySpecial)}><span>Add to Cart</span></button>
                </div>
              </div>
            </div>
          )}

          <CategoryFilter 
            menuType={menuType}
            onMenuTypeChange={(type) => {
                setMenuType(type);
                setActiveCategory('');
            }}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            categories={availableCategories}
          />

          <div style={{ padding: '0 2rem 5rem' }}>
            <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
              <h2 className="serif" style={{ color: 'var(--gold)', marginBottom: '1.5rem', textTransform: 'capitalize' }}>{activeCategory || 'Menu'}</h2>
              {filteredMenu.length === 0 ? <p className="text-muted">No items found in this category.</p> : (
                  <div className="menu-grid">
                    {filteredMenu.map((item, idx) => {
                      const cartItem = cart.find(i => i.id === item.id);
                      return (
                          <MenuCard 
                              key={item.id || idx} 
                              item={item} 
                              index={idx}
                              onAddToCart={addToCart}
                              onUpdateQuantity={updateQuantity}
                              cartQuantity={cartItem ? cartItem.quantity : 0}
                          />
                      );
                    })}
                  </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showPayment && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(26,22,16,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000, backdropFilter: 'blur(4px)' }}>
            <div style={{ background: 'var(--cream)', padding: '2.5rem', borderRadius: '4px', maxWidth: '450px', width: '90%', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--parchment)' }}>
                {!isProcessing ? (
                    <>
                        <h2 className="serif text-center" style={{ marginBottom: '1.5rem', color: 'var(--ink)' }}>Finalize Order</h2>
                        <span className="gold-rule" style={{ margin: '0 auto 2rem' }}></span>
                        
                        <div style={{ marginBottom: '2rem' }}>
                            <p className="eyebrow" style={{ color: 'var(--gold)', marginBottom: '1rem' }}>Payment Method</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: paymentMethod === 'QR' ? 'var(--cream-deep)' : 'white', padding: '1rem', borderRadius: '2px', border: `1px solid ${paymentMethod === 'QR' ? 'var(--gold)' : 'var(--parchment)'}`, cursor: 'pointer' }}>
                                    <input type="radio" name="payment" checked={paymentMethod === 'QR'} onChange={() => setPaymentMethod('QR')} />
                                    <span style={{ fontSize: '0.9rem', color: 'var(--ink)' }}>UPI / Scan QR Code</span>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: paymentMethod === 'COD' ? 'var(--cream-deep)' : 'white', padding: '1rem', borderRadius: '2px', border: `1px solid ${paymentMethod === 'COD' ? 'var(--gold)' : 'var(--parchment)'}`, cursor: 'pointer' }}>
                                    <input type="radio" name="payment" checked={paymentMethod === 'COD'} onChange={() => setPaymentMethod('COD')} />
                                    <span style={{ fontSize: '0.9rem', color: 'var(--ink)' }}>Cash on Delivery</span>
                                </label>
                            </div>
                        </div>

                        {paymentMethod === 'QR' && (
                            <div style={{ textAlign: 'center', marginBottom: '2rem', padding: '1.5rem', background: 'white', borderRadius: '4px', border: '1px dashed var(--gold)' }}>
                                {ownerQr ? (
                                    <img src={ownerQr} alt="QR Code" style={{ maxWidth: '100%', height: '220px', marginBottom: '1rem' }} />
                                ) : (
                                    <p style={{ color: '#c0392b', fontSize: '0.9rem' }}>QR Code unavailable. Please opt for COD.</p>
                                )}
                                <h3 className="serif" style={{ color: 'var(--gold)', fontSize: '1.4rem' }}>Total: ₹{cartTotal}</h3>
                            </div>
                        )}

                        <button onClick={processPayment} className="admin-btn admin-btn--primary" style={{ width: '100%', padding: '1rem', fontSize: '0.9rem' }}>Confirm & Send Order</button>
                        <button onClick={() => setShowPayment(false)} className="admin-btn admin-btn--secondary" style={{ width: '100%', marginTop: '0.5rem', border: 'none' }}>Cancel</button>
                    </>
                ) : (
                    <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                        <h2 className="serif">Simmering your order...</h2>
                        <div style={{ fontSize: '2rem', marginTop: '1.5rem' }}>⌛</div>
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
}

function AdminView({ menu, orders, dailySummaries, ownerQr, onDataUpdated, dailySpecial }) {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('adminToken') || !!localStorage.getItem('adminAuth'));
  const [password, setPassword] = useState('');
  const [newItem, setNewItem] = useState({ name: '', price: '', category: '', type: 'veg' });
  const [qrUrl, setQrUrl] = useState(ownerQr);
  const [dateFilter, setDateFilter] = useState('');
  const [specialForm, setSpecialForm] = useState({ name: '', imageUrl: '', price: '', type: 'veg' });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  // Check if the typed special name matches an existing menu item
  const matchedMenuItem = menu.find(
    item => item.name.toLowerCase() === specialForm.name.trim().toLowerCase() && !item.isSpecial
  );

  const [adminToken, setAdminToken] = useState(localStorage.getItem('adminToken') || null); // [Fix 1.3] JWT Token stored in state

  const handleLogin = async () => {
    // [Fix 1.3] Secure backend validation using bcrypt and JWT
    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });
        if (res.ok) {
            const data = await res.json();
            setAdminToken(data.token);
            localStorage.setItem('adminToken', data.token); // Save the JWT token to persist session
            // Seed the menu on admin login (requires auth token)
            try {
                await fetch(`${API_URL}/seed`, {
                    method: 'POST',
                    headers: { 'x-admin-token': data.token }
                });
                onDataUpdated();
            } catch (_) { /* seed failure is non-fatal */ }
            setIsAuthenticated(true);
        } else {
            alert('Access Denied.');
        }
    } catch (e) {
        alert('Server unreachable');
    }
  };

  const handleAdd = async () => {
    if (!newItem.name || !newItem.price) return;
    try {
        await fetch(`${API_URL}/menu`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken },
            body: JSON.stringify({ ...newItem, price: parseInt(newItem.price), timeHash: Date.now() })
        });
        setNewItem({ name: '', price: '', category: '', type: 'veg', imageUrl: '' });
        onDataUpdated();
    } catch(e) { console.error(e); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this item?')) return;
    try {
        await fetch(`${API_URL}/menu/${id}`, { method: 'DELETE', headers: { 'x-admin-token': adminToken } });
        onDataUpdated();
    } catch(e) { console.error(e); }
  };

  const updateQr = async () => {
    try {
        await fetch(`${API_URL}/settings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken },
            body: JSON.stringify({ ownerQr: qrUrl })
        });
        alert('QR code updated.');
    } catch(e) { console.error(e); }
  };

  const handleEndDay = async () => {
    if (!window.confirm('Are you sure you want to end the day? This will summarize all active orders and clear the current list.')) return;
    try {
        const res = await fetch(`${API_URL}/end-day`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken }
        });
        const data = await res.json();
        if (data.error) {
            alert(data.error);
        } else {
            alert(`Day ended successfully! Total Revenue: ₹${data.summary.total}`);
            onDataUpdated();
        }
    } catch(e) { console.error(e); }
  };

  const generateSpecial = async () => {
    if (!specialForm.name.trim() || !specialForm.price) return alert('Please fill in the item name and price.');
    // If the item is NOT in the menu, require an image URL
    if (!matchedMenuItem && !specialForm.imageUrl.trim()) return alert('Please provide an image URL for items not in the menu.');
    setIsGenerating(true);
    try {
        const payload = {
            name: specialForm.name,
            price: parseInt(specialForm.price),
            type: matchedMenuItem ? matchedMenuItem.type : specialForm.type
        };
        // Only send imageUrl if it's explicitly provided (for non-menu items)
        if (specialForm.imageUrl.trim()) {
            payload.imageUrl = specialForm.imageUrl;
        }
        const res = await fetch(`${API_URL}/generate-special`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken },
            body: JSON.stringify(payload)
        });
        if (!res.ok) { const err = await res.json(); return alert(err.error || 'Failed to publish special.'); }
        alert(`"${specialForm.name}" published as Today's Special!`);
        setSpecialForm({ name: '', imageUrl: '', price: '', type: 'veg' });
        onDataUpdated();
    } catch(e) { console.error(e); alert('Network error.'); } finally {
        setIsGenerating(false);
    }
  };

  const removeSpecial = async () => {
    if (!window.confirm('Remove the current daily special?')) return;
    setIsRemoving(true);
    try {
        const res = await fetch(`${API_URL}/daily-special`, {
            method: 'DELETE',
            headers: { 'x-admin-token': adminToken }
        });
        if (!res.ok) { const err = await res.json(); return alert(err.error || 'Failed to remove special.'); }
        alert('Daily special removed.');
        onDataUpdated();
    } catch(e) { console.error(e); alert('Network error.'); } finally {
        setIsRemoving(false);
    }
  };

  if (!isAuthenticated) {
    return (
        <div className="admin-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="admin-section" style={{ width: '100%', maxWidth: '350px', textAlign: 'center' }}>
                <h2 className="serif">Owner Access</h2>
                <span className="gold-rule" style={{ margin: '0 auto 1.5rem' }}></span>
                <input 
                    type="password" 
                    className="admin-input" 
                    placeholder="Enter Password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ marginBottom: '1rem' }}
                />
                <button onClick={handleLogin} className="admin-btn admin-btn--primary" style={{ width: '100%' }}>Login</button>
                <Link to="/" style={{ display: 'block', marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--text-soft)' }}>Return to Menu</Link>
            </div>
        </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-inner">
        <header className="admin-header">
            <h1 className="admin-title">Heritage Dashboard</h1>
            <div style={{ display: 'flex', gap: '1rem' }}>
                <Link to="/" className="admin-btn admin-btn--secondary">Visit Store</Link>
                <button 
                    className="admin-btn admin-btn--destructive" 
                    onClick={() => {
                        localStorage.removeItem('adminAuth');
                        localStorage.removeItem('adminToken');
                        setIsAuthenticated(false);
                        setAdminToken(null);
                    }}
                >
                    Log Out
                </button>
            </div>
        </header>

        <div className="admin-grid">
            <div className="admin-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2>Active Orders</h2>
                    {orders.length > 0 && (
                        <button onClick={handleEndDay} className="admin-btn admin-btn--destructive" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}>End Day</button>
                    )}
                </div>
                <span className="gold-rule"></span>
                {orders.length === 0 ? <p className="text-muted">No live orders.</p> : (
                    <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                        {orders.map((o) => (
                            <div key={o.id} style={{ padding: '1rem', borderBottom: '1px solid var(--parchment)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span className="order-badge">#{o.id}</span>
                                    <small className="text-muted">{o.time}</small>
                                </div>
                                <p style={{ fontSize: '0.8rem', margin: '0.3rem 0' }}>{o.method === 'QR' ? 'UPI' : 'COD'}</p>
                                <ul style={{ paddingLeft: '1rem', fontSize: '0.85rem' }}>
                                    {o.items?.map((it, idx) => <li key={idx}>{it.name} (x{it.quantity || 1})</li>)}
                                </ul>
                                <p style={{ marginTop: '0.5rem', fontWeight: '600' }}>₹{o.total}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="admin-section">
                <h2>Menu Editor</h2>
                <span className="gold-rule"></span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '2rem' }}>
                    <input className="admin-input" placeholder="Item Name" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} />
                    <input className="admin-input" placeholder="Price (₹)" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} />
                    <input className="admin-input" placeholder="Category (e.g. CURRIES)" value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})} />
                    <input className="admin-input" placeholder="Image URL" value={newItem.imageUrl} onChange={e => setNewItem({...newItem, imageUrl: e.target.value})} />
                    <select className="admin-input" value={newItem.type} onChange={e => setNewItem({...newItem, type: e.target.value})}>
                        <option value="veg">Vegetarian</option>
                        <option value="nonveg">Non-Vegetarian</option>
                    </select>
                    <button onClick={handleAdd} className="admin-btn admin-btn--primary">Add to Menu</button>
                </div>

                <div className="admin-section" style={{ border: 'none', padding: 0, boxShadow: 'none' }}>
                    <h3 className="serif" style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>QR Payment Settings</h3>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input className="admin-input" placeholder="QR Image URL" value={qrUrl} onChange={e => setQrUrl(e.target.value)} />
                        <button onClick={updateQr} className="admin-btn admin-btn--primary">Save</button>
                    </div>
                </div>

                <div className="admin-section" style={{ marginTop: '2rem' }}>
                    <h3 className="serif" style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>⭐ Add Today's Special</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-soft)', marginBottom: '1rem' }}>The special will appear in the menu under "TODAY'S SPECIAL" and as a banner above the menu.</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                        <input
                            className="admin-input"
                            placeholder="Special Item Name (e.g. Chef's Biryani)"
                            value={specialForm.name}
                            onChange={e => {
                                const name = e.target.value;
                                const match = menu.find(
                                    item => item.name.toLowerCase() === name.trim().toLowerCase() && !item.isSpecial
                                );
                                if (match) {
                                    setSpecialForm({ ...specialForm, name, price: String(match.price), type: match.type, imageUrl: '' });
                                } else {
                                    setSpecialForm({ ...specialForm, name });
                                }
                            }}
                        />
                        {matchedMenuItem && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem', background: '#e8f5e9', borderRadius: '4px', border: '1px solid #a5d6a7' }}>
                                <span style={{ fontSize: '1rem' }}>✅</span>
                                <span style={{ fontSize: '0.8rem', color: '#2e7d32' }}>
                                    Found in menu — image will be used automatically
                                </span>
                            </div>
                        )}
                        {!matchedMenuItem && (
                            <input
                                className="admin-input"
                                placeholder="Image URL (required for items not in menu)"
                                value={specialForm.imageUrl}
                                onChange={e => setSpecialForm({...specialForm, imageUrl: e.target.value})}
                            />
                        )}
                        <input
                            className="admin-input"
                            placeholder="Price (₹)"
                            type="number"
                            value={specialForm.price}
                            onChange={e => setSpecialForm({...specialForm, price: e.target.value})}
                        />
                        {!matchedMenuItem && (
                            <select className="admin-input" value={specialForm.type} onChange={e => setSpecialForm({...specialForm, type: e.target.value})}>
                                <option value="veg">Vegetarian</option>
                                <option value="nonveg">Non-Vegetarian</option>
                            </select>
                        )}
                        {/* Image preview: show matched menu item image or manually entered URL */}
                        {(matchedMenuItem?.imageUrl || specialForm.imageUrl) && (
                            <img
                                src={matchedMenuItem ? matchedMenuItem.imageUrl : specialForm.imageUrl}
                                alt="Preview"
                                style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--parchment)' }}
                            />
                        )}
                        <button
                            onClick={generateSpecial}
                            className="admin-btn admin-btn--primary"
                            style={{ background: isGenerating ? 'var(--text-soft)' : 'var(--gold)' }}
                            disabled={isGenerating}
                        >
                            {isGenerating ? 'Publishing...' : 'Publish as Today\'s Special'}
                        </button>
                    </div>
                    {dailySpecial && (
                        <div style={{ marginTop: '1.5rem', borderTop: '1px dashed var(--parchment)', paddingTop: '1.5rem' }}>
                            <p className="eyebrow" style={{ color: 'var(--ink)', marginBottom: '0.8rem' }}>Current Special Active:</p>
                            <img src={dailySpecial.imageUrl} alt="Special" style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '4px', marginBottom: '0.5rem' }} />
                            <p style={{ fontSize: '0.85rem', fontWeight: 600, margin: '0 0 1rem 0' }}>{dailySpecial.text}</p>
                            <button
                                onClick={removeSpecial}
                                className="admin-btn admin-btn--destructive"
                                style={{ width: '100%' }}
                                disabled={isRemoving}
                            >
                                {isRemoving ? 'Removing...' : '🗑️ Remove Daily Special'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>

        <details className="admin-section inventory-dropdown" open>
            <summary className="inventory-summary">
                <h2>Current Inventory</h2>
                <span className="inventory-count">{menu.length} items</span>
                <span className="inventory-chevron">▾</span>
            </summary>
            <span className="gold-rule" style={{ marginTop: '0.5rem' }}></span>
            <div className="admin-table-wrapper">
            <table className="admin-table">
                <thead>
                    <tr>
                        <th>Item Name</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {menu.map((item) => (
                        <tr key={item.id}>
                            <td style={{ fontWeight: 600 }}>{item.name}</td>
                            <td>{item.category}</td>
                            <td className="order-badge">₹{item.price}</td>
                            <td>
                                <button onClick={() => handleDelete(item.id)} className="admin-btn admin-btn--destructive" style={{ padding: '0.4rem 0.8rem' }}>Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            </div>
        </details>

        {dailySummaries && dailySummaries.length > 0 && (
            <div className="admin-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2>Daily Archives</h2>
                    <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-soft)' }}>Filter by Date:</span>
                        <input 
                            type="date" 
                            className="admin-input" 
                            style={{ padding: '0.4rem 0.8rem', width: 'auto', fontSize: '0.85rem' }} 
                            onChange={(e) => setDateFilter(e.target.value)}
                        />
                        {dateFilter && (
                            <button onClick={() => setDateFilter('')} className="admin-btn admin-btn--secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Clear</button>
                        )}
                    </div>
                </div>
                <span className="gold-rule"></span>
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {dailySummaries
                        .filter(s => !dateFilter || s.date === dateFilter)
                        .map((summary) => {
                            const data = JSON.parse(summary.orders_json);
                            return (
                                <div key={summary.id} style={{ padding: '1.5rem', background: 'var(--cream-deep)', borderRadius: '4px', border: '1px solid var(--parchment)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                        <h3 className="serif">{new Date(summary.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</h3>
                                        <span className="order-badge" style={{ background: 'var(--gold)', color: 'white' }}>₹{summary.total_revenue}</span>
                                    </div>
                                    <p style={{ fontSize: '0.9rem' }}>Total Orders: {summary.order_count}</p>
                                    <details style={{ marginTop: '1rem' }}>
                                        <summary style={{ cursor: 'pointer', fontSize: '0.8rem', color: 'var(--gold)' }}>View Details</summary>
                                        <div style={{ marginTop: '1rem', maxHeight: '300px', overflowY: 'auto', background: 'white', padding: '1rem', borderRadius: '2px' }}>
                                            {data.orders.map((o, idx) => (
                                                <div key={idx} style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--parchment)' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: '600' }}>
                                                        <span>Order #{o.id}</span>
                                                        <span>{o.method}</span>
                                                    </div>
                                                    <ul style={{ paddingLeft: '1rem', fontSize: '0.75rem', marginTop: '0.3rem' }}>
                                                        {o.items.map((it, iidx) => <li key={iidx}>{it.menu_name} (x{it.quantity}) - ₹{it.price_at_time}</li>)}
                                                    </ul>
                                                </div>
                                            ))}
                                        </div>
                                    </details>
                                </div>
                            );
                        })}
                </div>
            </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [dailySummaries, setDailySummaries] = useState([]);
  const [ownerQr, setOwnerQr] = useState('');
  const [dailySpecial, setDailySpecial] = useState(null);
  const [isOffline, setIsOffline] = useState(false); // [Fix 3.5] Offline flag state
  
  const loadData = async () => {
      try {
          const res = await fetch(`${API_URL}/data`);
          if (!res.ok) throw new Error('API request failed'); // [Fix 3.5] Propagate failure explicitly
          const data = await res.json();
          
          setMenu(data.menu);
          setOrders(data.orders.reverse());
          setDailySummaries(data.dailySummaries || []);
          setOwnerQr(data.settings?.ownerQr || '');
          setDailySpecial(data.dailySpecial || null);
          
          // [Fix 3.5] Clear offline flag on success
          if (isOffline) setIsOffline(false);
      } catch (e) { 
          // [Fix 3.5] Do not flood console, just toggle banner flag once
          if (!isOffline) {
              console.error('Connection to server lost:', e);
              setIsOffline(true);
          }
      }
  };

  useEffect(() => {
     loadData();
     const interval = setInterval(loadData, 5000);
     return () => clearInterval(interval);
  }, []);

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      {/* [Fix 3.5] Visible offline banner */}
      {isOffline && <div style={{ background: '#e74c3c', color: 'white', textAlign: 'center', padding: '10px', position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 9999 }}>⚠️ Connection lost. Trying to reconnect...</div>}
      <Routes>
        <Route path="/" element={<CustomerView menu={menu} cart={cart} setCart={setCart} ownerQr={ownerQr} onOrderComplete={loadData} dailySpecial={dailySpecial} />} />
        <Route path="/admin" element={<AdminView menu={menu} orders={orders} dailySummaries={dailySummaries} ownerQr={ownerQr} onDataUpdated={loadData} dailySpecial={dailySpecial} />} />
      </Routes>
    </BrowserRouter>
  );
}
