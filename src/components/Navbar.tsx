'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingBag, Clock, ShieldCheck, Utensils } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface NavbarProps {
  cartCount: number;
  onOpenCart: () => void;
  onOpenOrderTracker: () => void;
}

export function Navbar({ cartCount, onOpenCart, onOpenOrderTracker }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 bg-cream/95 backdrop-blur-md border-b border-parchment/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-full bg-gold/10 border border-gold/40 flex items-center justify-center text-gold group-hover:scale-105 transition-transform">
            <Utensils className="w-5 h-5 text-gold" />
          </div>
          <div>
            <span className="font-serif text-2xl font-bold tracking-tight text-ink group-hover:text-gold transition-colors">
              Heritage
            </span>
            <span className="block text-[10px] font-sans uppercase tracking-widest text-gold font-semibold -mt-1">
              Indian Cuisine
            </span>
          </div>
        </Link>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Order Tracker Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenOrderTracker}
            className="border-parchment hover:border-gold/60 text-ink-soft hover:text-ink text-xs flex items-center gap-1.5 rounded-full px-3 py-1 bg-white/70"
          >
            <Clock className="w-3.5 h-3.5 text-gold" />
            <span className="hidden sm:inline">Track Orders</span>
          </Button>

          {/* Admin Portal Link */}
          <Link href="/admin">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs text-ink-soft hover:text-gold flex items-center gap-1 rounded-full px-3 py-1"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Admin Portal</span>
            </Button>
          </Link>

          {/* Cart Button */}
          <Button
            type="button"
            onClick={onOpenCart}
            className="bg-gold hover:bg-gold-light text-white font-semibold text-xs flex items-center gap-2 rounded-full px-4 py-2 shadow-sm transition-transform active:scale-95"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">Dining Cart</span>
            {cartCount > 0 && (
              <Badge className="bg-white text-ink text-[11px] font-bold px-1.5 py-0.5 rounded-full ml-0.5">
                {cartCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
