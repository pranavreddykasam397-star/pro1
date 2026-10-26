'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Navbar } from '@/components/Navbar';
import { Hero } from '@/components/Hero';
import { CategoryFilter } from '@/components/CategoryFilter';
import { MenuCard, MenuItemData } from '@/components/MenuCard';
import { CartSidebar, CartItem } from '@/components/CartSidebar';
import { OrderTrackerModal } from '@/components/OrderTrackerModal';
import { trpc } from '@/lib/trpc/client';
import { Sparkles, WifiOff, UtensilsCrossed } from 'lucide-react';
import gsap from 'gsap';

export default function StorefrontPage() {
  // Navigation & Modals
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);

  // Progressive Interactive Flow State (Customer Journey)
  const [isPreferenceRevealed, setIsPreferenceRevealed] = useState(false);
  const [isMenuRevealed, setIsMenuRevealed] = useState(false);

  // Cart State (Persisted in localStorage)
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('heritageCart');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('heritageCart', JSON.stringify(cart));
  }, [cart]);

  // Filters State — Defaults to Curries when menu reveals
  const [dietaryFilter, setDietaryFilter] = useState<'all' | 'veg' | 'non-veg'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('CURRIES');

  // Offline detection state
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch Menu from tRPC with 5s polling interval
  const menuQuery = trpc.menu.getMenu.useQuery(undefined, {
    refetchInterval: 5000,
  });

  // Fetch UPI & QR Config
  const configQuery = trpc.settings.getConfig.useQuery();

  const menuSectionRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Filtered Menu & Counts
  const allDishes = (menuQuery.data?.menu || []) as MenuItemData[];
  const dailySpecial = menuQuery.data?.dailySpecial as MenuItemData | null;
  const categories = (menuQuery.data?.categories || []) as string[];

  const vegCount = useMemo(
    () => allDishes.filter((d) => d.type === 'veg').length,
    [allDishes]
  );
  const nonVegCount = useMemo(
    () => allDishes.filter((d) => d.type === 'non-veg').length,
    [allDishes]
  );

  // Step 1: Customer clicks "Explore Our Menu ↓"
  const handleExploreClick = () => {
    setIsPreferenceRevealed(true);
  };

  // Step 2: Customer selects either "Pure Veg" or "Non-Veg"
  const handleSelectPreference = (pref: 'veg' | 'non-veg') => {
    setDietaryFilter(pref);
    setSelectedCategory('CURRIES'); // Default category as requested
    setIsMenuRevealed(true);

    setTimeout(() => {
      if (menuSectionRef.current) {
        menuSectionRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 150);
  };

  // Step 3: Customer clicks a category tab with 3D Flip-Out and Pop-In
  const handleSelectCategory = (cat: string) => {
    if (cat === selectedCategory) return;

    if (gridRef.current) {
      const cards = gridRef.current.querySelectorAll('.dish-3d-card');
      if (cards.length > 0) {
        // Smooth 3D Flip Out with visible grace
        gsap.to(cards, {
          opacity: 0,
          y: -24,
          scale: 0.92,
          rotationX: -20,
          duration: 0.35,
          stagger: 0.02,
          ease: 'power2.in',
          onComplete: () => {
            setSelectedCategory(cat);
          },
        });
        return;
      }
    }
    setSelectedCategory(cat);
  };

  // Customer switches dietary filter (Veg <-> Non-Veg) with smooth 3D Flip Out
  const handleSelectDietaryFilter = (diet: 'all' | 'veg' | 'non-veg') => {
    if (diet === dietaryFilter) return;

    if (gridRef.current) {
      const cards = gridRef.current.querySelectorAll('.dish-3d-card');
      if (cards.length > 0) {
        gsap.to(cards, {
          opacity: 0,
          y: -24,
          scale: 0.92,
          rotationX: -20,
          duration: 0.35,
          stagger: 0.02,
          ease: 'power2.in',
          onComplete: () => {
            setDietaryFilter(diet);
          },
        });
        return;
      }
    }
    setDietaryFilter(diet);
  };

  // Trigger Rich 3D Stagger Entrance when Category, Dietary, or Dishes change
  useEffect(() => {
    if (gridRef.current && isMenuRevealed) {
      const cards = gridRef.current.querySelectorAll('.dish-3d-card');
      if (cards.length > 0) {
        gsap.fromTo(
          cards,
          {
            opacity: 0,
            y: 50,
            scale: 0.88,
            rotationX: 30,
            transformPerspective: 1000,
            transformOrigin: 'center top',
          },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            rotationX: 0,
            duration: 0.85,
            stagger: 0.065,
            ease: 'back.out(1.6)',
          }
        );
      }
    }
  }, [selectedCategory, dietaryFilter, isMenuRevealed, allDishes.length]);

  // Cart Actions
  const handleAddToCart = (item: MenuItemData) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: 1,
          type: item.type,
        },
      ];
    });
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (id: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveItem = (id: number) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const filteredDishes = useMemo(() => {
    return allDishes.filter((dish) => {
      // Dietary filter
      if (dietaryFilter === 'veg' && dish.type !== 'veg') return false;
      if (dietaryFilter === 'non-veg' && dish.type !== 'non-veg') return false;

      // Category filter
      if (selectedCategory && dish.category !== selectedCategory) return false;

      return true;
    });
  }, [allDishes, dietaryFilter, selectedCategory]);

  const totalCartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  // Determine if daily special matches current dietary filter
  const isSpecialVisible =
    dailySpecial &&
    (dietaryFilter === 'all' || dailySpecial.type === dietaryFilter);

  return (
    <div className="min-h-screen flex flex-col bg-cream text-ink">
      {/* Offline Alert Banner */}
      {isOffline && (
        <div className="bg-destructive text-white text-xs font-semibold py-2 px-4 text-center sticky top-0 z-50 flex items-center justify-center gap-2">
          <WifiOff className="w-4 h-4" /> Connection lost. Trying to reconnect...
        </div>
      )}

      {/* Navigation */}
      <Navbar
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenOrderTracker={() => setIsTrackerOpen(true)}
      />

      <main className="flex-1">
        {/* Hero Section — Full Viewport on Initial Load with 3D Card Box Emergence */}
        <Hero
          onExploreClick={handleExploreClick}
          isExpanded={isPreferenceRevealed}
          onSelectPreference={handleSelectPreference}
          selectedPreference={dietaryFilter}
          vegCount={vegCount}
          nonVegCount={nonVegCount}
        />

        {/* Menu Section — Smoothly Appears Once Preference is Chosen */}
        {isMenuRevealed && (
          <section
            ref={menuSectionRef}
            id="menu"
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-pop-down perspective-1200"
          >
            {/* Daily Special Highlight (If Matches Dietary Filter) */}
            {isSpecialVisible && (
              <div className="mb-10">
                <div className="bg-gradient-to-r from-gold/15 via-gold/10 to-gold/15 border border-gold/40 rounded-3xl p-6 sm:p-8 shadow-md flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-md">
                  <div className="space-y-2 text-center md:text-left">
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gold text-white text-[11px] font-bold uppercase tracking-wider shadow-xs">
                      <Sparkles className="w-3.5 h-3.5" /> Today's Chef Recommendation
                    </span>
                    <h2 className="font-serif text-3xl font-bold text-ink">
                      {dailySpecial.name}
                    </h2>
                    <p className="text-xs sm:text-sm text-ink-soft">
                      Signature handcrafted specialty of the day prepared with slow-cooked aromatic spices.
                    </p>
                    <p className="font-serif text-2xl font-bold text-gold">
                      ₹{dailySpecial.price}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => handleAddToCart(dailySpecial)}
                      className="bg-gold hover:bg-gold-light text-white font-semibold text-sm px-7 py-3.5 rounded-2xl shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
                    >
                      Order Chef's Special
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Menu Section Title */}
            <div className="text-center space-y-2 mb-6">
              <span className="text-xs font-semibold uppercase tracking-widest text-gold font-sans">
                Royal Dining Selection
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-ink">
                {selectedCategory} Specialties
              </h2>
              <div className="w-16 h-0.5 bg-gold/40 mx-auto mt-2" />
            </div>

            {/* Filtering Controls (Dietary Switcher + Category Tabs) */}
            <CategoryFilter
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={handleSelectCategory}
              dietaryFilter={dietaryFilter}
              onSelectDietaryFilter={handleSelectDietaryFilter}
            />

            {/* Menu Grid with 3D Staggered Cascade */}
            {menuQuery.isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pt-6">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="h-64 rounded-2xl bg-parchment/30 animate-pulse"
                  />
                ))}
              </div>
            ) : menuQuery.isError && filteredDishes.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <UtensilsCrossed className="w-12 h-12 text-gold mx-auto" />
                <p className="font-serif text-xl text-ink">
                  Unable to load dishes right now.
                </p>
                <button
                  type="button"
                  onClick={() => menuQuery.refetch()}
                  className="px-6 py-2.5 bg-gold hover:bg-gold-light text-white text-sm font-semibold rounded-xl shadow transition-all cursor-pointer"
                >
                  Retry Connecting
                </button>
              </div>
            ) : filteredDishes.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <UtensilsCrossed className="w-12 h-12 text-parchment mx-auto" />
                <p className="font-serif text-xl text-ink">
                  No {dietaryFilter === 'veg' ? 'vegetarian ' : dietaryFilter === 'non-veg' ? 'non-vegetarian ' : ''}dishes found in {selectedCategory}.
                </p>
                <p className="text-xs text-ink-soft">
                  Try switching categories above or viewing all dishes.
                </p>
              </div>
            ) : (
              /* 3D Dishes Grid with GSAP Stagger Deal */
              <div
                ref={gridRef}
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pt-6 perspective-1200"
              >
                {filteredDishes.map((dish) => {
                  const inCartItem = cart.find((i) => i.id === dish.id);
                  return (
                    <MenuCard
                      key={dish.id}
                      item={dish}
                      cartQuantity={inCartItem?.quantity || 0}
                      onAddToCart={handleAddToCart}
                      onUpdateQuantity={handleUpdateQuantity}
                    />
                  );
                })}
              </div>
            )}
          </section>
        )}
      </main>

      {/* Cart Drawer */}
      <CartSidebar
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        upiId={configQuery.data?.upiId || '9392767835@ybl'}
        ownerQr={configQuery.data?.ownerQr}
      />

      {/* Order Tracker Modal */}
      <OrderTrackerModal
        isOpen={isTrackerOpen}
        onClose={() => setIsTrackerOpen(false)}
      />

      {/* Footer */}
      <footer className="bg-ink text-parchment/80 py-12 border-t border-gold/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <h3 className="font-serif text-2xl font-bold text-white tracking-wide">
            Heritage Restaurant
          </h3>
          <p className="text-xs text-parchment/60 max-w-md mx-auto">
            Traditional Indian recipes passed down through generations. Fresh ingredients, royal spices, and uncompromising hospitality.
          </p>
          <div className="pt-4 text-xs text-parchment/40 border-t border-parchment/10">
            © 2026 Heritage Restaurant. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
