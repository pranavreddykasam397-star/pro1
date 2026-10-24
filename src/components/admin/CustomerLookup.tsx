'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc/client';
import { toast } from 'sonner';
import { UserCheck, Search, Key, Phone, Calendar, ShoppingBag } from 'lucide-react';

export function CustomerLookup() {
  const [searchInput, setSearchInput] = useState('');
  const [searchedId, setSearchedId] = useState<number | null>(null);

  const lookupQuery = trpc.customer.adminLookup.useQuery(
    { customerId: searchedId || 0 },
    {
      enabled: Boolean(searchedId),
      retry: false,
    }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const idNum = parseInt(searchInput.trim(), 10);
    if (isNaN(idNum) || idNum <= 0) {
      return toast.error('Please enter a valid numeric Customer ID.');
    }
    setSearchedId(idNum);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Search Bar */}
      <Card className="border-parchment bg-white shadow-sm p-6 rounded-xl">
        <form onSubmit={handleSearch} className="space-y-3">
          <div className="space-y-1">
            <h3 className="font-serif text-2xl font-bold text-ink flex items-center gap-2">
              <UserCheck className="w-6 h-6 text-gold" /> Customer Account Lookup
            </h3>
            <p className="text-xs text-ink-soft">
              Retrieve a patron's registered 4-digit PIN and historical dining records for counter support.
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <Input
              type="number"
              placeholder="Enter Customer ID (e.g. 10245)"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="bg-cream-deep/40 text-sm max-w-md"
            />
            <Button
              type="submit"
              disabled={lookupQuery.isLoading}
              className="bg-gold hover:bg-gold-light text-white text-xs px-6 font-semibold"
            >
              <Search className="w-3.5 h-3.5 mr-1" />
              {lookupQuery.isLoading ? 'Searching...' : 'Lookup Customer'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Error state */}
      {lookupQuery.isError && (
        <Card className="border-red-200 bg-red-50 p-4 text-center text-xs text-destructive rounded-xl">
          {lookupQuery.error.message || 'Customer not found.'}
        </Card>
      )}

      {/* Customer Record Display */}
      {lookupQuery.data && (
        <div className="space-y-6">
          <Card className="border-parchment bg-white shadow-sm rounded-xl overflow-hidden">
            <CardHeader className="bg-cream-deep/40 border-b border-parchment py-4">
              <CardTitle className="font-serif text-xl font-bold text-ink flex items-center justify-between">
                <span>Customer #{lookupQuery.data.customer.id}</span>
                <Badge className="bg-gold text-white font-sans text-xs">Verified Account</Badge>
              </CardTitle>
            </CardHeader>

            <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-cream-deep/30 border border-parchment">
                <div className="w-10 h-10 bg-gold/10 text-gold rounded-full flex items-center justify-center">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider">
                    Customer PIN
                  </p>
                  <p className="font-mono text-lg font-bold text-ink tracking-widest">
                    {lookupQuery.data.customer.pin}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-cream-deep/30 border border-parchment">
                <div className="w-10 h-10 bg-gold/10 text-gold rounded-full flex items-center justify-center">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider">
                    Phone Contact
                  </p>
                  <p className="font-medium text-sm text-ink">
                    {lookupQuery.data.customer.phone || 'Not provided'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-cream-deep/30 border border-parchment">
                <div className="w-10 h-10 bg-gold/10 text-gold rounded-full flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider">
                    Member Since
                  </p>
                  <p className="text-xs text-ink">
                    {new Date(lookupQuery.data.customer.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Historical Orders */}
          <Card className="border-parchment bg-white shadow-sm rounded-xl overflow-hidden">
            <CardHeader className="border-b border-parchment py-4">
              <CardTitle className="font-serif text-lg font-bold text-ink flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-gold" /> Order History ({lookupQuery.data.orders.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {lookupQuery.data.orders.length === 0 ? (
                <div className="text-center py-8 text-xs text-ink-soft">
                  No orders recorded for this customer yet.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-cream-deep/60 border-b border-parchment text-ink uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-3 px-4">Order #</th>
                      <th className="py-3 px-4">Date & Time</th>
                      <th className="py-3 px-4">Items</th>
                      <th className="py-3 px-4">Total</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-parchment/60">
                    {lookupQuery.data.orders.map((o) => (
                      <tr key={o.id} className="hover:bg-cream/40">
                        <td className="py-3 px-4 font-bold text-ink">#{o.id}</td>
                        <td className="py-3 px-4 text-ink-soft">
                          {new Date(o.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-0.5">
                            {o.items.map((it, idx) => (
                              <div key={idx} className="truncate">
                                {it.quantity}x {it.menu_name}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-serif font-bold text-sm text-ink">₹{o.total}</td>
                        <td className="py-3 px-4">
                          <Badge
                            className={`text-[10px] font-sans ${
                              o.paymentStatus === 'CONFIRMED'
                                ? 'bg-green-600 text-white'
                                : o.paymentStatus === 'PENDING'
                                ? 'bg-amber-500 text-white'
                                : 'bg-destructive text-white'
                            }`}
                          >
                            {o.paymentStatus}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
