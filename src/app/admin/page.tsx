'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AdminAuthModal } from '@/components/admin/AdminAuthModal';
import { OrderManagement } from '@/components/admin/OrderManagement';
import { MenuManagement } from '@/components/admin/MenuManagement';
import { CustomerLookup } from '@/components/admin/CustomerLookup';
import { SettingsAnalytics } from '@/components/admin/SettingsAnalytics';
import { Button } from '@/components/ui/button';
import {
  Shield,
  ShoppingBag,
  Utensils,
  UserCheck,
  Settings,
  LogOut,
  ExternalLink,
} from 'lucide-react';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<'orders' | 'menu' | 'customers' | 'settings'>('orders');

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminEmail');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-cream flex flex-col justify-between">
        <header className="p-4 border-b border-parchment flex justify-between items-center bg-white/70">
          <Link href="/" className="flex items-center gap-2 text-ink font-serif font-bold text-xl">
            <span className="text-gold">Heritage</span> Restaurant
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-xs text-ink-soft flex items-center gap-1">
              <ExternalLink className="w-3.5 h-3.5" /> Back to Storefront
            </Button>
          </Link>
        </header>

        <main className="flex-1 flex items-center justify-center p-4">
          <AdminAuthModal onAuthenticated={() => setIsAuthenticated(true)} />
        </main>

        <footer className="p-4 text-center text-xs text-ink-soft/70 border-t border-parchment">
          Heritage Restaurant Admin Portal · 2FA SMS & Better Auth Secured
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Admin Top Navigation */}
      <header className="bg-white border-b border-parchment sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gold/15 text-gold flex items-center justify-center border border-gold/40">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="font-serif text-xl font-bold text-ink">Heritage Admin</span>
              <span className="hidden sm:inline-block text-[10px] font-sans text-gold font-semibold uppercase tracking-wider ml-2 bg-gold/10 px-2 py-0.5 rounded">
                Management Console
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/" target="_blank">
              <Button
                variant="outline"
                size="sm"
                className="text-xs border-parchment text-ink-soft hover:text-ink flex items-center gap-1"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Customer View
              </Button>
            </Link>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-xs text-destructive hover:bg-red-50 flex items-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-1 sm:space-x-4 border-t border-parchment/60 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'orders'
                ? 'border-gold text-gold font-bold'
                : 'border-transparent text-ink-soft hover:text-ink'
            }`}
          >
            <ShoppingBag className="w-4 h-4" /> Live Orders Stream
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('menu')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'menu'
                ? 'border-gold text-gold font-bold'
                : 'border-transparent text-ink-soft hover:text-ink'
            }`}
          >
            <Utensils className="w-4 h-4" /> Menu Catalog & Specials
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('customers')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'customers'
                ? 'border-gold text-gold font-bold'
                : 'border-transparent text-ink-soft hover:text-ink'
            }`}
          >
            <UserCheck className="w-4 h-4" /> Customer PIN Lookup
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'settings'
                ? 'border-gold text-gold font-bold'
                : 'border-transparent text-ink-soft hover:text-ink'
            }`}
          >
            <Settings className="w-4 h-4" /> UPI & Daily Revenue
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {activeTab === 'orders' && <OrderManagement />}
        {activeTab === 'menu' && <MenuManagement />}
        {activeTab === 'customers' && <CustomerLookup />}
        {activeTab === 'settings' && <SettingsAnalytics />}
      </main>
    </div>
  );
}
