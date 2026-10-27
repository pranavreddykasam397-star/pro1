'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MorphingCartButton } from '@/components/ui/animated-button';
import { Plus, Minus, Sparkles } from 'lucide-react';

export interface MenuItemData {
  id: number;
  name: string;
  price: number;
  category: string;
  type: string;
  imageUrl?: string | null;
  isSpecial?: boolean;
}

interface MenuCardProps {
  item: MenuItemData;
  cartQuantity: number;
  onAddToCart: (item: MenuItemData) => void;
  onUpdateQuantity: (id: number, delta: number) => void;
}

export function MenuCard({
  item,
  cartQuantity,
  onAddToCart,
  onUpdateQuantity,
}: MenuCardProps) {
  const isVeg = item.type === 'veg';
  const fallbackImage = isVeg
    ? 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80'
    : 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80';

  return (
    <Card className="dish-3d-card group overflow-hidden border border-parchment/80 bg-white/90 backdrop-blur-xs hover:border-gold/60 rounded-2xl flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_-12px_rgba(184,146,42,0.25)] cursor-pointer">
      <div>
        {/* Dish Image with 3D Depth Zoom */}
        <div className="relative w-full h-48 bg-parchment/30 overflow-hidden">
          <img
            src={item.imageUrl || fallbackImage}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
            onError={(e) => {
              (e.target as HTMLImageElement).src = fallbackImage;
            }}
          />

          {/* Ambient Image Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          {/* Special Ribbon */}
          {item.isSpecial && (
            <Badge className="absolute top-2.5 left-2.5 bg-gradient-to-r from-gold to-gold-light text-white text-[10px] font-bold uppercase tracking-wider shadow-md flex items-center gap-1 border-0">
              <Sparkles className="w-3 h-3" /> Chef's Special
            </Badge>
          )}

          {/* Authentic Indian Dietary Indicator */}
          <div className="absolute top-2.5 right-2.5 bg-white/95 backdrop-blur-md p-1.5 rounded-md shadow-sm border border-parchment">
            <span
              className={`w-3.5 h-3.5 border-2 flex items-center justify-center rounded-2xs ${
                isVeg ? 'border-emerald-600' : 'border-rose-600'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isVeg ? 'bg-emerald-600' : 'bg-rose-600'
                }`}
              />
            </span>
          </div>
        </div>

        {/* Content */}
        <CardContent className="p-4 space-y-1.5">
          <span className="text-[10px] font-bold tracking-widest uppercase text-gold">
            {item.category}
          </span>
          <h3 className="font-serif text-lg sm:text-xl font-bold text-ink line-clamp-1 group-hover:text-gold transition-colors duration-200">
            {item.name}
          </h3>
        </CardContent>
      </div>

      {/* Footer Price & Add Button */}
      <div className="p-4 pt-0 flex items-center justify-between border-t border-parchment/40 mt-2">
        <div>
          <span className="text-[10px] uppercase tracking-wider text-ink-soft block font-medium">Price</span>
          <span className="font-serif text-xl sm:text-2xl font-bold text-ink">₹{item.price}</span>
        </div>

        <MorphingCartButton
          count={cartQuantity}
          onAdd={() => onAddToCart(item)}
          onIncrement={() => onUpdateQuantity(item.id, 1)}
          onDecrement={() => onUpdateQuantity(item.id, -1)}
        />
      </div>
    </Card>
  );
}
