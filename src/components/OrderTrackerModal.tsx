'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc/client';
import { toast } from 'sonner';
import { Clock, CheckCircle2, AlertCircle, ShoppingBag } from 'lucide-react';

interface OrderTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OrderTrackerModal({ isOpen, onClose }: OrderTrackerModalProps) {
  const [customerIdInput, setCustomerIdInput] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('customerAuth');
      if (saved) {
        try {
          return String(JSON.parse(saved).id || '');
        } catch {}
      }
    }
    return '';
  });

  const [pinInput, setPinInput] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('customerAuth');
      if (saved) {
        try {
          return String(JSON.parse(saved).pin || '');
        } catch {}
      }
    }
    return '';
  });

  const [submittedQuery, setSubmittedQuery] = useState<{
    customerId: number;
    pin: string;
  } | null>(null);

  // tRPC query to fetch customer orders with 5-second live polling!
  const ordersQuery = trpc.order.getCustomerOrders.useQuery(
    {
      customerId: submittedQuery?.customerId || 0,
      pin: submittedQuery?.pin || '',
    },
    {
      enabled: Boolean(submittedQuery?.customerId && submittedQuery?.pin),
      refetchInterval: 5000, // 5s live polling for order updates
      retry: false,
    }
  );

  const handleLookup = () => {
    const custId = parseInt(customerIdInput.trim(), 10);
    if (isNaN(custId)) {
      return toast.error('Please enter a valid Customer ID.');
    }
    if (!/^\d{4}$/.test(pinInput.trim())) {
      return toast.error('Please enter your 4-digit PIN.');
    }

    setSubmittedQuery({
      customerId: custId,
      pin: pinInput.trim(),
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <Badge className="bg-green-600 text-white font-sans text-[11px] flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Preparing Order
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge className="bg-destructive text-white font-sans text-[11px] flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Payment Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-amber-500 text-white font-sans text-[11px] flex items-center gap-1">
            <Clock className="w-3 h-3 animate-spin" /> Verifying Payment
          </Badge>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-cream text-ink border-parchment p-6 max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl font-bold text-ink flex items-center gap-2">
            <Clock className="w-5 h-5 text-gold" /> Track Your Orders
          </DialogTitle>
          <DialogDescription className="text-xs text-ink-soft">
            Enter your Customer ID and 4-digit PIN to check live payment and kitchen preparation status.
          </DialogDescription>
        </DialogHeader>

        {/* Credentials Form */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="space-y-1">
            <Label htmlFor="trackerCustId" className="text-xs font-semibold">
              Customer ID
            </Label>
            <Input
              id="trackerCustId"
              type="number"
              placeholder="e.g. 10245"
              value={customerIdInput}
              onChange={(e) => setCustomerIdInput(e.target.value)}
              className="bg-white text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="trackerPin" className="text-xs font-semibold">
              4-Digit PIN
            </Label>
            <Input
              id="trackerPin"
              type="password"
              maxLength={4}
              placeholder="••••"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              className="bg-white text-sm text-center tracking-widest font-bold"
            />
          </div>
        </div>

        <Button
          type="button"
          onClick={handleLookup}
          disabled={ordersQuery.isLoading}
          className="w-full bg-gold hover:bg-gold-light text-white font-semibold text-xs py-2 mt-1"
        >
          {ordersQuery.isLoading ? 'Checking...' : 'View Order History'}
        </Button>

        {/* Results Stream */}
        {ordersQuery.isError && (
          <p className="text-xs text-destructive text-center py-2 bg-red-50 rounded border border-red-200">
            {ordersQuery.error?.message || 'Could not retrieve orders. Check your ID and PIN.'}
          </p>
        )}

        {submittedQuery && ordersQuery.data && (
          <div className="space-y-3 pt-3 border-t border-parchment">
            <div className="flex items-center justify-between text-xs text-ink-soft">
              <span>Customer #{submittedQuery.customerId}</span>
              <span className="text-[11px] text-green-700 flex items-center gap-1 font-semibold">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" /> Live Status Polling
              </span>
            </div>

            {ordersQuery.data.length === 0 ? (
              <p className="text-xs text-ink-soft text-center py-4">No orders placed yet for this account.</p>
            ) : (
              <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
                {ordersQuery.data.map((order) => (
                  <div
                    key={order.id}
                    className="p-3 bg-white rounded-lg border border-parchment space-y-2 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-ink">Order #{order.id}</span>
                      {getStatusBadge(order.paymentStatus)}
                    </div>

                    <div className="text-xs space-y-1 text-ink-soft border-y border-dashed border-parchment py-1.5">
                      {order.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>
                            {it.quantity}x {it.menu_name}
                          </span>
                          <span>₹{it.price_at_time * it.quantity}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center text-xs pt-1">
                      <span className="text-[11px] text-ink-soft">
                        {new Date(order.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span className="font-serif font-bold text-sm text-gold">₹{order.total}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
