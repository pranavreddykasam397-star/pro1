'use client';

import React from 'react';
import { SlidingFilterPill } from '@/components/ui/animated-button';

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  dietaryFilter: 'all' | 'veg' | 'non-veg';
  onSelectDietaryFilter: (diet: 'all' | 'veg' | 'non-veg') => void;
  onResetPreference?: () => void;
  categoryCounts?: Record<string, number>;
}

// Visual category icons for an authentic Indian dining touch
const CATEGORY_ICONS: Record<string, string> = {
  CURRIES: '🍛',
  STARTERS: '🍢',
  BIRYANI: '🍚',
  BREADS: '🫓',
  DESSERTS: '🍨',
  BEVERAGES: '🥤',
  RICE: '🍚',
  SNACKS: '🥟',
};

export function CategoryFilter({
  categories,
  selectedCategory,
  onSelectCategory,
  dietaryFilter,
  onSelectDietaryFilter,
  onResetPreference,
  categoryCounts,
}: CategoryFilterProps) {
  return (
    <div className="space-y-5 py-4">
      {/* Active Dietary Status Banner & Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-white border border-parchment shadow-sm">
        <div className="flex items-center gap-3">
          {dietaryFilter === 'veg' ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-emerald-600 flex items-center justify-center rounded-sm bg-white shrink-0">
                <div className="w-2.5 h-2.5 bg-emerald-600 rounded-full" />
              </div>
              <div>
                <span className="text-xs sm:text-sm font-bold text-emerald-800">
                  Pure Vegetarian Selection
                </span>
                <span className="hidden sm:inline text-xs text-ink-soft ml-2">
                  (Only 100% veg recipes shown)
                </span>
              </div>
            </div>
          ) : dietaryFilter === 'non-veg' ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-rose-600 flex items-center justify-center rounded-sm bg-white shrink-0">
                <div className="w-2.5 h-2.5 bg-rose-600 rounded-full" />
              </div>
              <div>
                <span className="text-xs sm:text-sm font-bold text-rose-800">
                  Non-Vegetarian Selection
                </span>
                <span className="hidden sm:inline text-xs text-ink-soft ml-2">
                  (Chicken, Mutton, Seafood & Grills)
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-base">🍽️</span>
              <span className="text-xs sm:text-sm font-bold text-ink">
                Complete Culinary Menu
              </span>
            </div>
          )}
        </div>

        {/* Quick Switch Pills */}
        <div className="flex items-center gap-1.5 ml-auto">
          <SlidingFilterPill
            layoutId="dietary-filter-tab"
            isSelected={dietaryFilter === 'veg'}
            onClick={() => onSelectDietaryFilter('veg')}
            label="🌱 Veg"
            className="text-[11px] py-1.5 px-3 rounded-full"
          />
          <SlidingFilterPill
            layoutId="dietary-filter-tab"
            isSelected={dietaryFilter === 'non-veg'}
            onClick={() => onSelectDietaryFilter('non-veg')}
            label="🍗 Non-Veg"
            className="text-[11px] py-1.5 px-3 rounded-full"
          />
          <SlidingFilterPill
            layoutId="dietary-filter-tab"
            isSelected={dietaryFilter === 'all'}
            onClick={() => onSelectDietaryFilter('all')}
            label="View All"
            className="text-[11px] py-1.5 px-3 rounded-full"
          />
        </div>
      </div>

      {/* Mobile-Friendly Category Navigation Tabs */}
      <div className="relative">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none px-1 justify-start sm:justify-center">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            const count = categoryCounts ? categoryCounts[cat] ?? 0 : null;
            const icon = CATEGORY_ICONS[cat.toUpperCase()] || '🍲';
            return (
              <SlidingFilterPill
                key={cat}
                layoutId="active-category-filter-tab"
                isSelected={isSelected}
                disabled={count === 0}
                onClick={() => onSelectCategory(cat)}
                icon={<span>{icon}</span>}
                label={cat}
                badge={
                  count !== null ? (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : count === 0
                          ? 'bg-gray-100 text-gray-400'
                          : 'bg-cream-deep text-ink-soft'
                      }`}
                    >
                      {count}
                    </span>
                  ) : null
                }
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
